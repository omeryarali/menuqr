/**
 * The currencies a menu can be priced in.
 *
 * Deliberately a short closed list: the four codes here, the zod enum in
 * lib/validators/restaurant.ts and the CHECK constraint in migration 0014 all
 * hold the same set. Adding a fifth means touching all three, which is the
 * point — a code that exists in only one of them either fails at save time or
 * shows up blank in the picker.
 */

export const CURRENCY_CODES = ["TRY", "USD", "EUR", "GBP"] as const;

export type CurrencyCode = (typeof CURRENCY_CODES)[number];

export const DEFAULT_CURRENCY: CurrencyCode = "TRY";

/** Base UI resolves the trigger label from this map, not from the rendered items. */
export const CURRENCY_LABELS: Record<CurrencyCode, string> = {
  TRY: "₺ Türk Lirası",
  USD: "$ Amerikan Doları",
  EUR: "€ Euro",
  GBP: "£ İngiliz Sterlini",
};

/**
 * Free-text codes that used to be typed into the old input and mean one of the
 * supported currencies. The column's CHECK has always demanded exactly three
 * characters, so "TL" and "₺" could never be stored — but the retired ISO code
 * for the lira could.
 */
const ALIASES: Record<string, CurrencyCode> = {
  TL: "TRY",
  TRL: "TRY",
  "₺": "TRY",
  $: "USD",
  "€": "EUR",
  "£": "GBP",
};

/**
 * Narrows whatever the column holds to a supported code.
 *
 * Returns null rather than a default so callers decide what an unknown value
 * means; the form falls back to TRY so the picker can never render blank.
 */
export function normalizeCurrency(raw: string | null | undefined): CurrencyCode | null {
  if (!raw) return null;
  const code = raw.trim().toUpperCase();
  if ((CURRENCY_CODES as readonly string[]).includes(code)) return code as CurrencyCode;
  return ALIASES[code] ?? null;
}
