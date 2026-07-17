import { MapPin, Phone } from "lucide-react";

import type { Restaurant } from "@/types/database";

export function MenuHeader({ restaurant }: { restaurant: Restaurant }) {
  return (
    <header className="flex flex-col items-center gap-4 text-center">
      <h1
        className="text-4xl leading-tight text-balance sm:text-5xl"
        style={{
          fontFamily: "var(--menu-heading-font)",
          fontWeight: "var(--menu-heading-weight)",
          letterSpacing: "var(--menu-heading-tracking)",
        }}
      >
        {restaurant.name}
      </h1>

      {/* Accent rule under the name — a small flourish that ties to the theme. */}
      <span
        aria-hidden
        className="block h-px w-16"
        style={{ backgroundColor: "var(--menu-accent)", opacity: 0.7 }}
      />

      {restaurant.description ? (
        <p className="mx-auto max-w-prose text-sm leading-relaxed text-pretty" style={{ color: "var(--menu-muted)" }}>
          {restaurant.description}
        </p>
      ) : null}

      {restaurant.address || restaurant.phone ? (
        <div
          className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5 text-sm"
          style={{ color: "var(--menu-muted)" }}
        >
          {restaurant.address ? (
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="size-3.5" style={{ color: "var(--menu-accent)" }} aria-hidden />
              {restaurant.address}
            </span>
          ) : null}
          {restaurant.phone ? (
            <a href={`tel:${restaurant.phone}`} className="inline-flex items-center gap-1.5 hover:underline">
              <Phone className="size-3.5" style={{ color: "var(--menu-accent)" }} aria-hidden />
              {restaurant.phone}
            </a>
          ) : null}
        </div>
      ) : null}
    </header>
  );
}
