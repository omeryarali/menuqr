/**
 * Bulk price arithmetic.
 *
 * Pure and shared: the dialog previews with it and the server action re-runs it
 * before writing. Anything that changes here changes both, so a preview can
 * never show one number and save another.
 */

export type PriceMode = "percent" | "amount";
export type PriceDirection = "increase" | "decrease";

/** Round the result to a whole multiple. 0 keeps the exact kuruş value. */
export const ROUNDING_STEPS = [0, 1, 5, 10] as const;
export type RoundingStep = (typeof ROUNDING_STEPS)[number];

export type PriceChange = {
  mode: PriceMode;
  direction: PriceDirection;
  /** Percent (0–100+) or a flat currency amount, depending on `mode`. */
  value: number;
  rounding: RoundingStep;
};

/** Matches numeric(10,2) in the products table. */
export const MAX_PRICE = 99_999_999.99;

/** A x11 price is already absurd; past this the input is a typo, not a raise. */
export const MAX_PERCENT = 1000;

export type PriceChangeIssue =
  | "invalid-mode"
  | "invalid-direction"
  | "invalid-rounding"
  | "not-a-number"
  | "negative"
  | "percent-too-large"
  | "amount-too-large";

const MODES: readonly PriceMode[] = ["percent", "amount"];
const DIRECTIONS: readonly PriceDirection[] = ["increase", "decrease"];

/**
 * Why a change spec cannot be applied, or null when it can.
 *
 * The direction selector is the *only* source of the sign. A negative value is
 * rejected rather than flipped or absolute-valued: "Zam" with -10 quietly
 * discounting the whole menu is the exact failure this guards, and silently
 * reinterpreting the input would hide the typo instead of surfacing it.
 *
 * Everything here is checked at runtime even though the type says otherwise —
 * `bulkUpdatePrices` takes this object straight off the wire.
 */
export function priceChangeIssue(change: PriceChange): PriceChangeIssue | null {
  if (!MODES.includes(change.mode)) return "invalid-mode";
  if (!DIRECTIONS.includes(change.direction)) return "invalid-direction";
  if (!ROUNDING_STEPS.includes(change.rounding)) return "invalid-rounding";
  if (!Number.isFinite(change.value)) return "not-a-number";
  if (change.value < 0) return "negative";
  if (change.mode === "percent" && change.value > MAX_PERCENT) return "percent-too-large";
  if (change.mode === "amount" && change.value > MAX_PRICE) return "amount-too-large";
  return null;
}

/**
 * Reads the raw text of the value input.
 *
 * Turkish keyboards produce a comma decimal separator. An empty box means
 * "nothing typed yet" (null), not 0, so it can stay silent instead of showing
 * an error before the owner has typed anything; unparseable text yields NaN,
 * which `priceChangeIssue` reports.
 */
export function parsePriceInput(raw: string): number | null {
  const trimmed = raw.trim().replace(",", ".");
  if (!trimmed) return null;
  return Number(trimmed);
}

export function computeNewPrice(current: number, change: PriceChange): number {
  // An invalid spec is a no-op rather than an approximation: the preview then
  // lists no rows and the apply button disables itself, and the server reaches
  // the same conclusion from the same input.
  if (!Number.isFinite(current) || priceChangeIssue(change) !== null) return current;

  const delta = change.mode === "percent" ? current * (change.value / 100) : change.value;
  const signed = change.direction === "increase" ? current + delta : current - delta;

  // A discount bigger than the price must land on free, not a negative number
  // the CHECK constraint would reject.
  let next = Math.max(0, signed);

  if (change.rounding > 0) {
    next = Math.round(next / change.rounding) * change.rounding;
  }

  // Two decimals, and never past what numeric(10,2) can hold.
  return Math.min(MAX_PRICE, Math.round(next * 100) / 100);
}

export type PricePreviewRow = { id: string; name: string; from: number; to: number };

/** Rows whose price actually moves. Unchanged products are dropped. */
export function previewPriceChange(
  products: { id: string; name: string; price: number }[],
  change: PriceChange,
): PricePreviewRow[] {
  return products
    .map((product) => ({
      id: product.id,
      name: product.name,
      from: product.price,
      to: computeNewPrice(product.price, change),
    }))
    .filter((row) => row.to !== row.from);
}
