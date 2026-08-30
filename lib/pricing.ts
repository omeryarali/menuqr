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

export function computeNewPrice(current: number, change: PriceChange): number {
  if (!Number.isFinite(current) || !Number.isFinite(change.value)) return current;

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
