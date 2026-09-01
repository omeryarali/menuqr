import { z } from "zod";

import { CURRENCY_CODES } from "@/lib/currencies";
import { parseOpeningHours } from "@/lib/opening-hours";
import { normalizeTrPhone } from "@/lib/phone";

/** 0001_init.sql içindeki slug CHECK kısıtının birebir karşılığı. */
export const slugSchema = z
  .string()
  .trim()
  .min(3, "Menü adresi en az 3 karakter olmalı")
  .max(60, "Menü adresi en fazla 60 karakter olabilir")
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Sadece küçük harf, rakam ve tek tire kullanın");

/**
 * A coordinate from the map field, or null when there is no pin.
 *
 * Empty means "no location", not 0 — Number("") is 0, which is a real place in
 * the Gulf of Guinea and exactly the kind of value that looks fine in the
 * column and wrong on a map.
 */
const optionalCoordinate = (limit: number, message: string) =>
  z
    .string()
    .optional()
    .transform((raw, ctx) => {
      const trimmed = raw?.trim();
      if (!trimmed) return null;

      const value = Number(trimmed);
      if (!Number.isFinite(value) || Math.abs(value) > limit) {
        ctx.addIssue({ code: "custom", message });
        return z.NEVER;
      }
      return value;
    });

export const restaurantSchema = z.object({
  name: z.string().trim().min(1, "İsim gerekli").max(120, "İsim çok uzun"),
  slug: slugSchema,
  description: z.string().trim().max(500, "Açıklama çok uzun").optional().or(z.literal("")),
  address: z.string().trim().max(255, "Adres çok uzun").optional().or(z.literal("")),
  // Stored as +90XXXXXXXXXX whatever the form sends: the field submits the
  // national part, but a pasted "+90 532 …" or an old "0532 …" normalizes to
  // the same string. Empty stays empty — the phone is optional.
  phone: z
    .string()
    .trim()
    .max(32, "Telefon çok uzun")
    .optional()
    .transform((raw, ctx) => {
      if (!raw) return "";

      const normalized = normalizeTrPhone(raw);
      if (!normalized) {
        ctx.addIssue({
          code: "custom",
          message: "Telefonu 10 hane olarak girin (örn. 532 123 45 67)",
        });
        return z.NEVER;
      }
      return normalized;
    }),
  // Mirrors the CHECK in 0014_currency.sql. Unlike `theme` this does not
  // .catch() a default: currency is a price, and quietly saving a menu in the
  // wrong one is worse than refusing the save.
  currency: z.enum(CURRENCY_CODES, { error: "Desteklenmeyen para birimi" }),
  // Mirrors the range CHECKs in 0016_location.sql.
  latitude: optionalCoordinate(90, "Geçersiz enlem"),
  longitude: optionalCoordinate(180, "Geçersiz boylam"),
  isPublished: z.boolean(),
  // Mirrors the CHECK in 0003_theme.sql. Unknown values fall back rather than
  // erroring, so a stale form can't block a save.
  theme: z.enum(["classic", "modern", "warm", "dark-lux"]).catch("classic"),
  // Arrives as a JSON string from OpeningHoursField. parseOpeningHours drops
  // malformed days rather than failing the whole save — a bad hour must not
  // block someone renaming their restaurant.
  openingHours: z
    .string()
    .optional()
    .transform((raw) => {
      if (!raw) return null;
      try {
        return parseOpeningHours(JSON.parse(raw));
      } catch {
        return null;
      }
    }),
})
  // Mirrors restaurants_coordinates_paired: half a coordinate is a point in the
  // ocean, so the pair is stored whole or not at all.
  .superRefine((input, ctx) => {
    if ((input.latitude === null) === (input.longitude === null)) return;
    ctx.addIssue({
      code: "custom",
      path: ["latitude"],
      message: "Konum eksik. Haritadan bir nokta seçin ya da konumu kaldırın.",
    });
  });

export type RestaurantInput = z.infer<typeof restaurantSchema>;
