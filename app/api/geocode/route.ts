import { NextResponse, type NextRequest } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { reverseGeocode, searchPlaces, type GeoOutcome } from "@/lib/geocode";

/**
 * GET /api/geocode?q=…            — forward search
 * GET /api/geocode?lat=…&lon=…    — reverse lookup for a dropped pin
 *
 * Exists so the browser never calls Nominatim directly: their policy caps one
 * request per second per source and demands an identifying User-Agent, neither
 * of which the browser can honour on our behalf (see lib/geocode.ts).
 *
 * Signed-in only. Not because the data is secret — it is public OSM — but
 * because an open proxy in front of a rate-limited third party is a free way
 * for anyone to get our IP blocked.
 */
export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { searchParams } = request.nextUrl;
  const query = searchParams.get("q");
  const lat = searchParams.get("lat");
  const lon = searchParams.get("lon");

  let outcome: GeoOutcome;

  if (query !== null) {
    outcome = await searchPlaces(query);
  } else if (lat !== null && lon !== null) {
    outcome = await reverseGeocode(Number(lat), Number(lon));
  } else {
    return NextResponse.json({ error: "Eksik parametre" }, { status: 400 });
  }

  if (outcome.status === "busy") {
    return NextResponse.json(
      { error: "Adres servisi meşgul. Birkaç saniye sonra tekrar deneyin." },
      { status: 429 },
    );
  }
  if (outcome.status === "error") {
    return NextResponse.json({ error: "Adres araması şu an çalışmıyor." }, { status: 502 });
  }

  return NextResponse.json(
    { results: outcome.results },
    // Nominatim's own cache lives in lib/geocode; this stops a browser or proxy
    // from holding a stale answer for a query the owner is still typing.
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
