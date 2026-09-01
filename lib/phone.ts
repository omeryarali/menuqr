/**
 * Turkish phone numbers.
 *
 * The column stores one shape — `+90` followed by the ten national digits — so
 * `tel:` links work from a customer's phone and schema.org gets E.164. The form
 * shows the `+90` as fixed furniture and only ever edits the national part.
 *
 * Numbers that are not ten national digits (a 444 service line, a foreign
 * number) are left exactly as typed rather than mangled into the pattern; they
 * simply do not normalize.
 */

export const TR_DIAL_CODE = "+90";

const NATIONAL_LENGTH = 10;

/**
 * The ten national digits behind whatever the owner (or the old free-text box)
 * wrote, or null when it is not a Turkish number in a shape we recognize.
 *
 * Accepts the four forms the legacy rows actually contain: "532...",
 * "0532...", "90532..." and "+90 532 ...", spaces and punctuation included.
 */
export function trNationalDigits(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();

  // A number that states a country code other than +90 is not ours to
  // reinterpret: "+49 30 123456" is ten digits once punctuation is stripped and
  // would otherwise be stored as a Turkish number.
  if (/^\+(?!90)/.test(trimmed) || /^00(?!90)/.test(trimmed)) return null;

  let digits = trimmed.replace(/\D/g, "");
  if (digits.length > 12 && digits.startsWith("00")) digits = digits.slice(2);
  if (digits.length === 13 && digits.startsWith("090")) digits = digits.slice(3);
  if (digits.length === 12 && digits.startsWith("90")) digits = digits.slice(2);
  if (digits.length === 11 && digits.startsWith("0")) digits = digits.slice(1);

  // A national number never starts with 0 — "0532123456" is ten digits but one
  // short, and padding it into +900532… would invent a number.
  if (digits.length !== NATIONAL_LENGTH || digits.startsWith("0")) return null;
  return digits;
}

/** `+90XXXXXXXXXX`, or null when the input is not a recognizable TR number. */
export function normalizeTrPhone(raw: string | null | undefined): string | null {
  const national = trNationalDigits(raw);
  return national ? `${TR_DIAL_CODE}${national}` : null;
}

/** "532 123 45 67" — the grouping the form's input shows. */
export function groupTrNational(national: string): string {
  return [national.slice(0, 3), national.slice(3, 6), national.slice(6, 8), national.slice(8, 10)]
    .filter(Boolean)
    .join(" ");
}

/**
 * "+90 532 123 45 67" for display. Anything unrecognized is returned untouched,
 * so a legacy row still shows the owner what is stored instead of vanishing.
 */
export function formatTrPhone(value: string | null | undefined): string {
  if (!value) return "";
  const national = trNationalDigits(value);
  return national ? `${TR_DIAL_CODE} ${groupTrNational(national)}` : value;
}
