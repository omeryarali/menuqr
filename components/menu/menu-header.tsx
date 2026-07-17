import { MapPin, Phone } from "lucide-react";

import type { Restaurant } from "@/types/database";

export function MenuHeader({ restaurant }: { restaurant: Restaurant }) {
  return (
    <header className="space-y-3 border-b pb-6 text-center">
      <h1 className="text-3xl font-semibold tracking-tight text-balance">{restaurant.name}</h1>

      {restaurant.description ? (
        <p className="text-muted-foreground mx-auto max-w-prose text-sm text-pretty">
          {restaurant.description}
        </p>
      ) : null}

      <div className="text-muted-foreground flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-sm">
        {restaurant.address ? (
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="size-3.5" aria-hidden />
            {restaurant.address}
          </span>
        ) : null}
        {restaurant.phone ? (
          <a href={`tel:${restaurant.phone}`} className="inline-flex items-center gap-1.5 hover:underline">
            <Phone className="size-3.5" aria-hidden />
            {restaurant.phone}
          </a>
        ) : null}
      </div>
    </header>
  );
}
