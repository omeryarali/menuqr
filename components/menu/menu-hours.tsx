import { Clock } from "lucide-react";

import type { MenuStrings } from "@/lib/i18n";
import { DAY_KEYS, formatDayHours, isOpenNow, todayKey, type OpeningHours } from "@/lib/opening-hours";

/**
 * "Open now" state plus the week, for the public menu.
 *
 * Evaluated on the server, which is safe here only because /menu/[slug] is
 * force-dynamic — on a cached page this badge would freeze at whatever it said
 * when the page was built.
 *
 * Uses native <details> so the week expands with no JavaScript: this renders on
 * a customer's phone, often on a bad connection.
 */
export function MenuHours({ hours, strings }: { hours: OpeningHours | null; strings: MenuStrings }) {
  if (!hours) return null;

  const open = isOpenNow(hours);
  const today = todayKey();
  const todayHours = formatDayHours(hours[today]);

  return (
    <details className="group w-full max-w-xs">
      <summary className="flex cursor-pointer list-none items-center justify-center gap-2 text-sm">
        <span
          className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1"
          style={{ borderColor: "var(--menu-border)" }}
        >
          <span
            aria-hidden
            className="inline-block size-1.5 rounded-full"
            style={{ backgroundColor: open ? "var(--menu-accent)" : "var(--menu-muted)" }}
          />
          <span style={{ color: open ? "var(--menu-fg)" : "var(--menu-muted)" }}>
            {open ? strings.openNow : strings.closedNow}
          </span>
          {todayHours ? (
            <span style={{ color: "var(--menu-muted)" }}>· {todayHours}</span>
          ) : null}
          <Clock
            className="size-3 transition-transform group-open:rotate-180"
            style={{ color: "var(--menu-muted)" }}
            aria-hidden
          />
        </span>
      </summary>

      <dl className="mt-3 space-y-1 text-sm">
        {DAY_KEYS.map((day, index) => {
          const value = formatDayHours(hours[day]);
          const isToday = day === today;
          return (
            <div
              key={day}
              className="flex items-baseline justify-between gap-4"
              style={{ color: isToday ? "var(--menu-fg)" : "var(--menu-muted)" }}
            >
              <dt className={isToday ? "font-medium" : undefined}>{strings.days[index]}</dt>
              <dd className="tabular-nums">{value ?? strings.closed}</dd>
            </div>
          );
        })}
      </dl>
    </details>
  );
}
