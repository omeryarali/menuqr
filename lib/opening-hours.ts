/**
 * Opening hours: storage shape, "open now" evaluation and display helpers.
 *
 * Times are wall-clock strings ("HH:MM") in Europe/Istanbul — see migration
 * 0009 for why there is no per-restaurant timezone.
 */

export const DAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
export type DayKey = (typeof DAY_KEYS)[number];

export type DayHours = { open: string; close: string };

/** A missing or null day means closed. */
export type OpeningHours = Partial<Record<DayKey, DayHours | null>>;

export const DAY_LABELS: Record<DayKey, string> = {
  mon: "Pazartesi",
  tue: "Salı",
  wed: "Çarşamba",
  thu: "Perşembe",
  fri: "Cuma",
  sat: "Cumartesi",
  sun: "Pazar",
};

const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

export function isValidTime(value: string): boolean {
  return TIME_PATTERN.test(value);
}

function toMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

/**
 * Narrows an untrusted JSON value (the DB column) to OpeningHours.
 *
 * Anything malformed degrades to "no hours set" rather than throwing — a bad
 * value must never take down a customer's menu.
 */
export function parseOpeningHours(value: unknown): OpeningHours | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;

  const source = value as Record<string, unknown>;
  const result: OpeningHours = {};
  let hasAny = false;

  for (const day of DAY_KEYS) {
    const entry = source[day];
    if (!entry || typeof entry !== "object") continue;

    const { open, close } = entry as Record<string, unknown>;
    if (typeof open !== "string" || typeof close !== "string") continue;
    if (!isValidTime(open) || !isValidTime(close) || open === close) continue;

    result[day] = { open, close };
    hasAny = true;
  }

  return hasAny ? result : null;
}

/** Weekday + minutes since midnight, as they read on a clock in Istanbul. */
function nowInIstanbul(now: Date): { day: DayKey; minutes: number } {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Istanbul",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);

  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value ?? "";

  const weekday = get("weekday").toLowerCase().slice(0, 3) as DayKey;
  const day = DAY_KEYS.includes(weekday) ? weekday : "mon";

  return { day, minutes: Number(get("hour")) * 60 + Number(get("minute")) };
}

function previousDay(day: DayKey): DayKey {
  const index = DAY_KEYS.indexOf(day);
  return DAY_KEYS[(index + DAY_KEYS.length - 1) % DAY_KEYS.length];
}

/**
 * Whether the restaurant is open at `now`.
 *
 * Handles shifts that run past midnight, which is the normal case for the bars
 * using this: "18:00–02:00" on Friday means Saturday's small hours are still
 * Friday's shift, so yesterday's entry has to be consulted too.
 */
export function isOpenNow(hours: OpeningHours | null, now: Date = new Date()): boolean | null {
  if (!hours) return null;

  const { day, minutes } = nowInIstanbul(now);

  const today = hours[day];
  if (today) {
    const open = toMinutes(today.open);
    const close = toMinutes(today.close);
    // Same-day shift, or the pre-midnight half of an overnight one.
    if (close > open ? minutes >= open && minutes < close : minutes >= open) return true;
  }

  const yesterday = hours[previousDay(day)];
  if (yesterday) {
    const open = toMinutes(yesterday.open);
    const close = toMinutes(yesterday.close);
    // The post-midnight half of yesterday's overnight shift.
    if (close < open && minutes < close) return true;
  }

  return false;
}

/** Today's key, for highlighting the current row in a week list. */
export function todayKey(now: Date = new Date()): DayKey {
  return nowInIstanbul(now).day;
}

/** "09:00 – 22:00", or null when closed that day. */
export function formatDayHours(entry: DayHours | null | undefined): string | null {
  return entry ? `${entry.open} – ${entry.close}` : null;
}

/**
 * schema.org openingHoursSpecification entries.
 *
 * Day names must be the English schema.org ones, so this maps away from our
 * short keys rather than reusing the Turkish labels.
 */
const SCHEMA_DAYS: Record<DayKey, string> = {
  mon: "Monday",
  tue: "Tuesday",
  wed: "Wednesday",
  thu: "Thursday",
  fri: "Friday",
  sat: "Saturday",
  sun: "Sunday",
};

export function toSchemaOpeningHours(hours: OpeningHours | null) {
  if (!hours) return undefined;

  const entries = DAY_KEYS.flatMap((day) => {
    const value = hours[day];
    if (!value) return [];
    return [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: `https://schema.org/${SCHEMA_DAYS[day]}`,
        opens: value.open,
        closes: value.close,
      },
    ];
  });

  return entries.length > 0 ? entries : undefined;
}
