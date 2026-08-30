/**
 * Public-menu localisation.
 *
 * Turkish is the base: it lives in the ordinary `name`/`description` columns,
 * and everything else is an override stored in `translations` (migration 0013).
 * That means a menu with no translations at all behaves exactly as before, and
 * a half-finished translation shows Turkish for the parts that are missing
 * rather than blanks.
 *
 * Only the customer-facing menu is localised. The dashboard stays Turkish —
 * see the Language section in CLAUDE.md.
 */

export const LOCALES = ["tr", "en"] as const;
export type Locale = (typeof LOCALES)[number];

/** The language the content columns themselves are written in. */
export const BASE_LOCALE: Locale = "tr";

/** Narrows an untrusted value (a query string) to a supported locale. */
export function resolveLocale(value: string | null | undefined): Locale {
  return LOCALES.includes(value as Locale) ? (value as Locale) : BASE_LOCALE;
}

export type TranslationEntry = { name?: string; description?: string };
export type Translations = Partial<Record<Locale, TranslationEntry>>;

/**
 * Narrows the untrusted JSONB column.
 *
 * Blank strings are dropped, not stored as empty overrides — otherwise clearing
 * an English name in the dashboard would show an empty product on the menu
 * instead of falling back to Turkish.
 */
export function parseTranslations(value: unknown): Translations | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;

  const source = value as Record<string, unknown>;
  const result: Translations = {};
  let hasAny = false;

  for (const locale of LOCALES) {
    if (locale === BASE_LOCALE) continue;

    const entry = source[locale];
    if (!entry || typeof entry !== "object") continue;

    const { name, description } = entry as Record<string, unknown>;
    const parsed: TranslationEntry = {};

    if (typeof name === "string" && name.trim()) parsed.name = name.trim();
    if (typeof description === "string" && description.trim()) {
      parsed.description = description.trim();
    }

    if (parsed.name || parsed.description) {
      result[locale] = parsed;
      hasAny = true;
    }
  }

  return hasAny ? result : null;
}

/** Applies a translation over the base row, field by field. */
export function localize<T extends { name: string; description: string | null }>(
  row: T,
  translations: unknown,
  locale: Locale,
): { name: string; description: string | null } {
  if (locale === BASE_LOCALE) return { name: row.name, description: row.description };

  const entry = parseTranslations(translations)?.[locale];
  return {
    name: entry?.name ?? row.name,
    description: entry?.description ?? row.description,
  };
}

/**
 * Fixed strings on the menu.
 *
 * A hand-written record rather than an i18n library: two locales and ~20 keys
 * do not justify the dependency, and TypeScript already catches a key missing
 * from either language.
 *
 * Every value must stay serialisable — this object is handed to client
 * components, and React cannot pass a function across that boundary. Anything
 * that needs to interpolate lives outside it (see metaDescription).
 */
export type MenuStrings = {
  soldOut: string;
  soldOutLong: string;
  featured: string;
  openNow: string;
  closedNow: string;
  closed: string;
  menuUpdating: string;
  draftPreview: string;
  poweredBy: string;
  close: string;
  previous: string;
  next: string;
  openDetails: string;
  openImage: string;
  openDetailsFor: string;
  menuSuffix: string;
  languageLabel: string;
  /** Monday-first, matching DAY_KEYS in lib/opening-hours.ts. */
  days: readonly string[];
};

const STRINGS: Record<Locale, MenuStrings> = {
  tr: {
    soldOut: "Tükendi",
    soldOutLong: "Şu anda tükendi.",
    featured: "Şefin önerisi",
    openNow: "Şu an açık",
    closedNow: "Şu an kapalı",
    closed: "Kapalı",
    menuUpdating: "Bu menü güncelleniyor. Lütfen kısa süre sonra tekrar bakın.",
    draftPreview: "Taslak önizleme — bunu yalnızca siz görüyorsunuz. Herkese açmak için restoranı yayınlayın.",
    poweredBy: "MenuQR ile hazırlandı",
    close: "Kapat",
    previous: "Önceki",
    next: "Sonraki",
    openDetails: "Ürün ayrıntısını aç",
    openImage: "büyük görseli aç",
    openDetailsFor: "ayrıntıları aç",
    menuSuffix: "Menü",
    languageLabel: "Dil",
    days: ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"],
  },
  en: {
    soldOut: "Sold out",
    soldOutLong: "Currently sold out.",
    featured: "Chef's recommendation",
    openNow: "Open now",
    closedNow: "Closed now",
    closed: "Closed",
    menuUpdating: "This menu is being updated. Please check back shortly.",
    draftPreview: "Draft preview — only you can see this. Publish the restaurant to make it public.",
    poweredBy: "Powered by MenuQR",
    close: "Close",
    previous: "Previous",
    next: "Next",
    openDetails: "Open product details",
    openImage: "open larger image",
    openDetailsFor: "open details",
    menuSuffix: "Menu",
    languageLabel: "Language",
    days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
  },
};

export function menuStrings(locale: Locale): MenuStrings {
  return STRINGS[locale];
}

/**
 * Meta description for the menu page.
 *
 * A standalone function rather than a MenuStrings key: it interpolates, and a
 * function inside that record would break every client component it is passed
 * to. Only generateMetadata (server-side) calls it.
 */
export function metaDescription(locale: Locale, name: string): string {
  return locale === "en" ? `Browse the menu for ${name}.` : `${name} menüsünü inceleyin.`;
}

/** Labels for the switcher, in each language's own name. */
export const LOCALE_LABELS: Record<Locale, string> = {
  tr: "Türkçe",
  en: "English",
};
