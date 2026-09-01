import "server-only";

import { env } from "@/lib/env";

/**
 * Nominatim (OpenStreetMap geocoding), called only from the server.
 *
 * Their usage policy is not advisory: at most one request per second from one
 * source, and a User-Agent that identifies the application. A browser calling
 * nominatim.openstreetmap.org directly satisfies neither — every visitor would
 * be a separate uncoordinated source, and the UA would be the browser's. So the
 * dashboard talks to /api/geocode and this module is the only thing that talks
 * to Nominatim.
 *
 * Search is restricted to Turkey, matching the rest of the app (Turkish UI,
 * +90 phone numbers, Europe/Istanbul hours). Drop `countrycodes` here if that
 * ever stops being true.
 */

const NOMINATIM = "https://nominatim.openstreetmap.org";
const COUNTRY = "tr";
const LANGUAGE = "tr";

/** One request per second, with headroom for clock jitter. */
const MIN_INTERVAL_MS = 1100;

/** Past this, a caller is told to retry rather than parked in a queue. */
const MAX_WAIT_MS = 3000;

const CACHE_TTL_MS = 15 * 60 * 1000;
const CACHE_MAX_ENTRIES = 200;

export type GeoResult = {
  /** display_name from OSM: what goes into the address field when picked. */
  label: string;
  latitude: number;
  longitude: number;
};

export type GeoOutcome =
  | { status: "ok"; results: GeoResult[] }
  | { status: "busy" }
  | { status: "error" };

const cache = new Map<string, { at: number; results: GeoResult[] }>();

/**
 * Next free slot in the rate limit, in ms from now, or null when the queue is
 * already longer than MAX_WAIT_MS.
 *
 * Per-instance state. Serverless can run several instances, so this is a floor
 * rather than a guarantee — the client also debounces, and the cache absorbs
 * repeats. A hard global limit would need shared storage, which is more moving
 * parts than a dashboard address picker earns.
 */
let nextSlotAt = 0;

function reserveSlot(): number | null {
  const now = Date.now();
  const start = Math.max(now, nextSlotAt);
  if (start - now > MAX_WAIT_MS) return null;

  nextSlotAt = start + MIN_INTERVAL_MS;
  return start - now;
}

function readCache(key: string): GeoResult[] | null {
  const hit = cache.get(key);
  if (!hit) return null;

  if (Date.now() - hit.at > CACHE_TTL_MS) {
    cache.delete(key);
    return null;
  }
  return hit.results;
}

function writeCache(key: string, results: GeoResult[]): void {
  // Oldest-first eviction; Map preserves insertion order.
  if (cache.size >= CACHE_MAX_ENTRIES) {
    const oldest = cache.keys().next();
    if (!oldest.done) cache.delete(oldest.value);
  }
  cache.set(key, { at: Date.now(), results });
}

type NominatimPlace = { display_name?: unknown; lat?: unknown; lon?: unknown };

/** Narrows one untrusted result; anything malformed is dropped, not guessed. */
function toResult(place: NominatimPlace): GeoResult | null {
  const latitude = Number(place.lat);
  const longitude = Number(place.lon);
  const label = typeof place.display_name === "string" ? place.display_name.trim() : "";

  if (!label || !Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180) return null;

  return { label, latitude, longitude };
}

async function request(path: string, cacheKey: string): Promise<GeoOutcome> {
  const cached = readCache(cacheKey);
  if (cached) return { status: "ok", results: cached };

  const wait = reserveSlot();
  if (wait === null) return { status: "busy" };
  if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));

  try {
    const response = await fetch(`${NOMINATIM}${path}`, {
      headers: {
        // Required by the policy: names the application and where to complain.
        "User-Agent": `MenuQR/1.0 (${env.NEXT_PUBLIC_SITE_URL})`,
        "Accept-Language": LANGUAGE,
      },
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) return { status: "error" };

    const payload: unknown = await response.json();
    const places = Array.isArray(payload) ? payload : [payload];
    const results = places
      .filter((place): place is NominatimPlace => Boolean(place) && typeof place === "object")
      .map(toResult)
      .filter((result): result is GeoResult => result !== null);

    writeCache(cacheKey, results);
    return { status: "ok", results };
  } catch {
    // Network failure or timeout. The caller shows a message; an address can
    // still be typed by hand, so this is never fatal.
    return { status: "error" };
  }
}

export async function searchPlaces(query: string): Promise<GeoOutcome> {
  const trimmed = query.trim().slice(0, 120);
  if (trimmed.length < 3) return { status: "ok", results: [] };

  const params = new URLSearchParams({
    q: trimmed,
    format: "jsonv2",
    limit: "5",
    countrycodes: COUNTRY,
    "accept-language": LANGUAGE,
  });

  return request(`/search?${params}`, `s:${trimmed.toLowerCase()}`);
}

export async function reverseGeocode(latitude: number, longitude: number): Promise<GeoOutcome> {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return { status: "error" };
  if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180) return { status: "error" };

  // Five decimals (~1 m) is finer than any address needs and makes the cache
  // actually hit while someone nudges the pin around.
  const lat = latitude.toFixed(5);
  const lon = longitude.toFixed(5);

  const params = new URLSearchParams({
    lat,
    lon,
    format: "jsonv2",
    zoom: "18",
    "accept-language": LANGUAGE,
  });

  return request(`/reverse?${params}`, `r:${lat},${lon}`);
}
