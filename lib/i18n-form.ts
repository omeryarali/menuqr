import type { Json } from "@/types/database";

/**
 * Turns the dashboard's flat English fields into the `translations` column.
 *
 * Returns null when nothing is filled in, so an untranslated row stores NULL
 * rather than an empty object — that keeps "has a translation" a simple null
 * check everywhere else.
 */
export function buildTranslations(nameEn?: string, descriptionEn?: string): Json | null {
  const entry: Record<string, string> = {};
  if (nameEn?.trim()) entry.name = nameEn.trim();
  if (descriptionEn?.trim()) entry.description = descriptionEn.trim();

  return Object.keys(entry).length > 0 ? { en: entry } : null;
}
