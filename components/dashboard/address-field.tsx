"use client";

import { useEffect, useRef, useState } from "react";

import dynamic from "next/dynamic";

import { Loader2, MapPin, Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { GeoResult } from "@/lib/geocode";

const LocationMap = dynamic(() => import("@/components/dashboard/location-map"), {
  ssr: false,
  loading: () => <div className="bg-muted h-64 w-full animate-pulse rounded-lg" />,
});

/** Nominatim allows one request per second; stay well clear of it. */
const DEBOUNCE_MS = 700;
const MIN_QUERY = 3;

type Coordinates = { latitude: number; longitude: number };

/**
 * Address text plus the map that fills it in.
 *
 * The text stays the source of truth for what a customer reads — an OSM
 * display_name is often more bureaucratic than useful — so picking a place
 * fills the box and the owner can then edit it. A later map click only
 * overwrites text this component wrote itself; anything typed by hand survives.
 *
 * Every geocoding call goes through /api/geocode. The browser must not talk to
 * Nominatim directly: their policy needs one request per second from one source
 * and an identifying User-Agent (see lib/geocode.ts).
 */
export function AddressField({
  defaultAddress,
  defaultLatitude,
  defaultLongitude,
}: {
  defaultAddress: string;
  defaultLatitude: number | null;
  defaultLongitude: number | null;
}) {
  const [address, setAddress] = useState(defaultAddress);
  const [coordinates, setCoordinates] = useState<Coordinates | null>(
    defaultLatitude !== null && defaultLongitude !== null
      ? { latitude: defaultLatitude, longitude: defaultLongitude }
      : null,
  );

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GeoResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  // The last address this component filled in. Anything else is the owner's own
  // text and must not be overwritten by a map click.
  const autoFilled = useRef<string | null>(defaultAddress ? null : "");
  const timer = useRef<number | undefined>(undefined);
  const inFlight = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      window.clearTimeout(timer.current);
      inFlight.current?.abort();
    };
  }, []);

  async function geocode(path: string): Promise<GeoResult[] | null> {
    inFlight.current?.abort();
    const controller = new AbortController();
    inFlight.current = controller;

    try {
      const response = await fetch(path, { signal: controller.signal });
      const payload = await response.json();

      if (!response.ok) {
        setNotice(typeof payload?.error === "string" ? payload.error : "Adres araması başarısız.");
        return null;
      }
      setNotice(null);
      return (payload?.results ?? []) as GeoResult[];
    } catch (error) {
      // An aborted request is the next keystroke, not a failure.
      if (error instanceof DOMException && error.name === "AbortError") return null;
      setNotice("Adres servisine ulaşılamadı.");
      return null;
    }
  }

  async function runSearch(value: string) {
    setSearching(true);
    const found = await geocode("/api/geocode?q=" + encodeURIComponent(value));
    setSearching(false);

    if (!found) return;
    setResults(found);
    if (found.length === 0) setNotice("Sonuç bulunamadı. Adresi elle yazabilirsiniz.");
  }

  function onQueryChange(value: string) {
    setQuery(value);
    window.clearTimeout(timer.current);

    if (value.trim().length < MIN_QUERY) {
      setResults([]);
      setNotice(null);
      return;
    }
    timer.current = window.setTimeout(() => void runSearch(value), DEBOUNCE_MS);
  }

  function choose(result: GeoResult) {
    setAddress(result.label);
    autoFilled.current = result.label;
    setCoordinates({ latitude: result.latitude, longitude: result.longitude });
    setResults([]);
    setQuery("");
  }

  async function pickPoint(latitude: number, longitude: number) {
    setCoordinates({ latitude, longitude });

    const found = await geocode("/api/geocode?lat=" + latitude + "&lon=" + longitude);
    const label = found?.[0]?.label;
    if (!label) return;

    // Only replace text this component wrote, never the owner's own wording.
    if (!address.trim() || address === autoFilled.current) {
      setAddress(label);
      autoFilled.current = label;
    }
  }

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Label htmlFor="address">Adres</Label>
        <Input
          id="address"
          name="address"
          value={address}
          onChange={(event) => setAddress(event.target.value)}
          placeholder="Mahalle, sokak, no"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="address-search">Haritada ara</Label>
        <div className="flex gap-2">
          <Input
            id="address-search"
            // No name: this box is a search field, not part of the submission.
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            // Enter inside a form submits it; here it must search instead.
            onKeyDown={(event) => {
              if (event.key !== "Enter") return;
              event.preventDefault();
              window.clearTimeout(timer.current);
              if (query.trim().length >= MIN_QUERY) void runSearch(query);
            }}
            placeholder="Örn. Bağdat Caddesi 100, Kadıköy"
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="Adresi ara"
            disabled={searching || query.trim().length < MIN_QUERY}
            onClick={() => {
              window.clearTimeout(timer.current);
              void runSearch(query);
            }}
          >
            {searching ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : (
              <Search className="size-4" aria-hidden />
            )}
          </Button>
        </div>

        {results.length > 0 ? (
          <ul className="divide-y rounded-lg border">
            {results.map((result) => (
              <li key={result.latitude + "," + result.longitude}>
                <button
                  type="button"
                  onClick={() => choose(result)}
                  className="hover:bg-accent flex w-full items-start gap-2 px-3 py-2 text-left text-sm"
                >
                  <MapPin className="text-muted-foreground mt-0.5 size-4 shrink-0" aria-hidden />
                  <span className="min-w-0">{result.label}</span>
                </button>
              </li>
            ))}
          </ul>
        ) : null}

        {notice ? <p className="text-muted-foreground text-sm">{notice}</p> : null}
      </div>

      <LocationMap
        latitude={coordinates?.latitude ?? null}
        longitude={coordinates?.longitude ?? null}
        onPick={pickPoint}
      />

      <div className="flex items-center justify-between gap-3">
        <p className="text-muted-foreground text-xs">
          {coordinates
            ? "Konum: " + coordinates.latitude.toFixed(5) + ", " + coordinates.longitude.toFixed(5)
            : "Haritaya tıklayarak veya arayarak konum seçin. Konum zorunlu değil."}
        </p>

        {coordinates ? (
          <Button type="button" variant="ghost" size="sm" onClick={() => setCoordinates(null)}>
            <X className="size-4" aria-hidden />
            Konumu kaldır
          </Button>
        ) : null}
      </div>

      {/* Submitted with the form; six decimals matches numeric(9,6). */}
      <input
        type="hidden"
        name="latitude"
        value={coordinates ? coordinates.latitude.toFixed(6) : ""}
      />
      <input
        type="hidden"
        name="longitude"
        value={coordinates ? coordinates.longitude.toFixed(6) : ""}
      />
    </div>
  );
}
