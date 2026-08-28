import Link from "next/link";

import { ArrowRight, CircleCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Readiness } from "@/lib/readiness";
import type { Restaurant } from "@/types/database";

/**
 * One restaurant's row on the overview: identity, publish state, and what is
 * still missing.
 *
 * A finished menu collapses to a single "hazır" line instead of a checked-off
 * list — a checklist that stays on screen after you've completed it reads as
 * nagging, and the owner's attention should go to the restaurants that still
 * need work.
 */
export function ReadinessCard({
  restaurant,
  readiness,
}: {
  restaurant: Restaurant;
  readiness: Readiness;
}) {
  const complete = readiness.remaining.length === 0;

  return (
    <div className="space-y-3 rounded-lg border p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate font-medium">{restaurant.name}</p>
          <p className="text-muted-foreground truncate text-sm">/menu/{restaurant.slug}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Badge variant={restaurant.is_published ? "default" : "secondary"}>
            {restaurant.is_published ? "Yayında" : "Taslak"}
          </Badge>
          <Button variant="ghost" size="sm" render={<Link href={`/dashboard/restaurants/${restaurant.id}`} />}>
            Yönet
          </Button>
        </div>
      </div>

      {complete ? (
        <p className="text-muted-foreground flex items-center gap-1.5 text-sm">
          <CircleCheck className="text-primary size-4" aria-hidden />
          Menünüz hazır.
        </p>
      ) : (
        <div className="space-y-2.5">
          <div className="flex items-center gap-3">
            <div
              className="bg-muted h-1.5 flex-1 overflow-hidden rounded-full"
              role="progressbar"
              aria-valuenow={readiness.percent}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`${restaurant.name} kurulum ilerlemesi`}
            >
              <div className="bg-primary h-full rounded-full" style={{ width: `${readiness.percent}%` }} />
            </div>
            <span className="text-muted-foreground shrink-0 text-xs tabular-nums">
              {readiness.done}/{readiness.total}
            </span>
          </div>

          <ul className="space-y-1">
            {/* Only the next few steps: a full seven-item list on every
                restaurant turns the overview into a wall of chores. */}
            {readiness.remaining.slice(0, 3).map((check) => (
              <li key={check.id}>
                <Link
                  href={check.href}
                  className="text-muted-foreground hover:text-foreground group inline-flex items-center gap-1.5 text-sm"
                >
                  <span className="border-muted-foreground/40 size-3.5 rounded-full border" aria-hidden />
                  {check.label}
                  <ArrowRight
                    className="size-3 opacity-0 transition-opacity group-hover:opacity-100"
                    aria-hidden
                  />
                </Link>
              </li>
            ))}
            {readiness.remaining.length > 3 ? (
              <li className="text-muted-foreground pl-5 text-xs">
                +{readiness.remaining.length - 3} adım daha
              </li>
            ) : null}
          </ul>
        </div>
      )}
    </div>
  );
}
