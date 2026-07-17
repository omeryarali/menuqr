/**
 * Slugify for restaurant URLs (/menu/{slug}).
 *
 * Must produce something matching the DB's slug CHECK constraint:
 *   ^[a-z0-9]+(-[a-z0-9]+)*$
 *
 * Turkish letters are transliterated explicitly. NFD normalization strips
 * combining accents (é -> e) but would turn "ı" into "i" and drop "ğ"
 * entirely, which mangles real restaurant names.
 */
const TURKISH_MAP: Record<string, string> = {
  ç: "c",
  ğ: "g",
  ı: "i",
  ö: "o",
  ş: "s",
  ü: "u",
  Ç: "c",
  Ğ: "g",
  İ: "i",
  Ö: "o",
  Ş: "s",
  Ü: "u",
};

export function slugify(input: string): string {
  return input
    .trim()
    .replace(/[çğıöşüÇĞİÖŞÜ]/g, (char) => TURKISH_MAP[char] ?? char)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/g, "");
}

/** Appends a short random suffix so a taken slug can be retried. */
export function withSuffix(slug: string): string {
  const suffix = Math.random().toString(36).slice(2, 6);
  return `${slug.slice(0, 55)}-${suffix}`;
}
