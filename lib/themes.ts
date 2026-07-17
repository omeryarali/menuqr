/**
 * Public-menu theme registry. Single source of truth for the three presets.
 *
 * The actual colors live as CSS variables in app/globals.css under
 * [data-menu-theme="…"]; this file carries the id/label/description and the
 * swatch colors the dashboard picker previews. Keep the ids in sync with the
 * CHECK constraint in supabase/migrations/0003_theme.sql.
 */
export const MENU_THEMES = [
  {
    id: "classic",
    label: "Klasik",
    description: "Zarif, serif başlıklar ve krem tonları. Fine-dining hissi.",
    swatch: { bg: "#f7f2e9", fg: "#2b2118", accent: "#9a6b3f" },
  },
  {
    id: "modern",
    label: "Modern",
    description: "Koyu, yüksek kontrast, sade. Çağdaş kafe havası.",
    swatch: { bg: "#141416", fg: "#f4f4f5", accent: "#c9f24d" },
  },
  {
    id: "warm",
    label: "Sıcak",
    description: "Sıcak turuncu tonları, samimi ve davetkâr. Ailece mekânlar.",
    swatch: { bg: "#fff6ee", fg: "#3d2415", accent: "#e0602f" },
  },
] as const;

export type MenuThemeId = (typeof MENU_THEMES)[number]["id"];

export const DEFAULT_THEME: MenuThemeId = "classic";

const THEME_IDS = MENU_THEMES.map((theme) => theme.id) as readonly string[];

/** Narrows an untrusted string (DB value, form input) to a known theme id. */
export function resolveTheme(value: string | null | undefined): MenuThemeId {
  return value && THEME_IDS.includes(value) ? (value as MenuThemeId) : DEFAULT_THEME;
}
