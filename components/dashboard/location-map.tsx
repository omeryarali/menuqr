"use client";

import { useEffect, useRef } from "react";

import L from "leaflet";

import "leaflet/dist/leaflet.css";

/** Whole-country view when there is no pin yet. */
const TURKEY_CENTER: [number, number] = [39.0, 35.2];
const TURKEY_ZOOM = 5;
const PIN_ZOOM = 16;

/**
 * The Leaflet map. Imported only through next/dynamic with ssr: false —
 * Leaflet touches `window` at module scope and throws during a server render.
 *
 * Default export because that is what dynamic() expects.
 */
export default function LocationMap({
  latitude,
  longitude,
  onPick,
}: {
  latitude: number | null;
  longitude: number | null;
  onPick: (latitude: number, longitude: number) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  // Latest-callback ref: the map is created once, so the click handler must not
  // capture the first render's onPick.
  const onPickRef = useRef(onPick);
  useEffect(() => {
    onPickRef.current = onPick;
  }, [onPick]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: TURKEY_CENTER,
      zoom: TURKEY_ZOOM,
      // A form is a scrolling page; grabbing the wheel here traps the reader.
      scrollWheelZoom: false,
    });

    // Attribution is a condition of using OSM tiles, not decoration.
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> katkıda bulunanlar',
    }).addTo(map);

    map.on("click", (event: L.LeafletMouseEvent) => {
      onPickRef.current(event.latlng.lat, event.latlng.lng);
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (latitude === null || longitude === null) {
      markerRef.current?.remove();
      markerRef.current = null;
      return;
    }

    const position: [number, number] = [latitude, longitude];

    if (!markerRef.current) {
      // A div icon rather than Leaflet's default marker: the default is a PNG
      // referenced by relative path, which every bundler rewrites and then 404s.
      const icon = L.divIcon({
        className: "",
        html: '<span style="display:block;width:18px;height:18px;border-radius:9999px;background:#dc2626;border:3px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.5)"></span>',
        iconSize: [18, 18],
        iconAnchor: [9, 9],
      });

      const marker = L.marker(position, { draggable: true, icon }).addTo(map);
      marker.on("dragend", () => {
        const { lat, lng } = marker.getLatLng();
        onPickRef.current(lat, lng);
      });

      markerRef.current = marker;
      map.setView(position, PIN_ZOOM);
      return;
    }

    markerRef.current.setLatLng(position);
    // Only chase the pin when it has left the view, so a deliberate pan is not
    // undone on every nudge.
    if (!map.getBounds().contains(position)) map.setView(position, PIN_ZOOM);
  }, [latitude, longitude]);

  return (
    // isolate: Leaflet's panes sit at z-index 400+ and would otherwise slide
    // over the dashboard's sticky header.
    <div
      ref={containerRef}
      className="isolate h-64 w-full overflow-hidden rounded-lg border"
      role="application"
      aria-label="Konum haritası"
    />
  );
}
