"use client";

import { useState } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { DAY_KEYS, DAY_LABELS, type DayKey, type OpeningHours } from "@/lib/opening-hours";

type DayState = { enabled: boolean; open: string; close: string };

const DEFAULTS = { open: "09:00", close: "22:00" };

/**
 * Per-day opening hours editor.
 *
 * Serialises the whole week into one hidden JSON input rather than 21 named
 * fields, so the server action parses a single value with one zod schema
 * instead of reassembling the week from flat form keys.
 */
export function OpeningHoursField({ value }: { value: OpeningHours | null }) {
  const [days, setDays] = useState<Record<DayKey, DayState>>(() =>
    Object.fromEntries(
      DAY_KEYS.map((day) => {
        const entry = value?.[day];
        return [day, { enabled: Boolean(entry), open: entry?.open ?? DEFAULTS.open, close: entry?.close ?? DEFAULTS.close }];
      }),
    ) as Record<DayKey, DayState>,
  );

  function update(day: DayKey, patch: Partial<DayState>) {
    setDays((current) => ({ ...current, [day]: { ...current[day], ...patch } }));
  }

  // Only enabled days are submitted; a disabled day is simply absent, which the
  // parser reads as closed.
  const payload: OpeningHours = {};
  for (const day of DAY_KEYS) {
    const state = days[day];
    if (state.enabled) payload[day] = { open: state.open, close: state.close };
  }

  /** Copies Monday's times to every enabled day — most menus repeat one shift. */
  function applyMondayToAll() {
    const source = days.mon;
    setDays((current) =>
      Object.fromEntries(
        DAY_KEYS.map((day) => [day, { ...current[day], open: source.open, close: source.close }]),
      ) as Record<DayKey, DayState>,
    );
  }

  return (
    <fieldset className="space-y-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <legend className="text-sm font-medium">Çalışma saatleri</legend>
        <button
          type="button"
          onClick={applyMondayToAll}
          className="text-muted-foreground hover:text-foreground text-xs underline underline-offset-4"
        >
          Pazartesi saatlerini tüm günlere uygula
        </button>
      </div>
      <p className="text-muted-foreground text-sm">
        Menüde &ldquo;şu an açık&rdquo; bilgisi olarak görünür. Gece yarısını geçen saatler
        desteklenir (örn. 18:00 – 02:00).
      </p>

      <input type="hidden" name="openingHours" value={JSON.stringify(payload)} />

      <div className="space-y-2">
        {DAY_KEYS.map((day) => {
          const state = days[day];
          return (
            <div key={day} className="flex flex-wrap items-center gap-3 rounded-lg border p-3">
              <div className="flex min-w-36 items-center gap-2.5">
                <Switch
                  checked={state.enabled}
                  onCheckedChange={(next) => update(day, { enabled: next })}
                  aria-label={`${DAY_LABELS[day]} açık mı`}
                />
                <Label className="cursor-default">{DAY_LABELS[day]}</Label>
              </div>

              {state.enabled ? (
                <div className="flex items-center gap-2">
                  <Input
                    type="time"
                    value={state.open}
                    onChange={(event) => update(day, { open: event.target.value })}
                    className="w-32"
                    aria-label={`${DAY_LABELS[day]} açılış saati`}
                  />
                  <span className="text-muted-foreground text-sm">–</span>
                  <Input
                    type="time"
                    value={state.close}
                    onChange={(event) => update(day, { close: event.target.value })}
                    className="w-32"
                    aria-label={`${DAY_LABELS[day]} kapanış saati`}
                  />
                </div>
              ) : (
                <span className="text-muted-foreground text-sm">Kapalı</span>
              )}
            </div>
          );
        })}
      </div>
    </fieldset>
  );
}
