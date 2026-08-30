import { z } from "zod";

export const categorySchema = z.object({
  restaurantId: z.string().uuid("Bir restoran seçin"),
  name: z.string().trim().min(1, "İsim gerekli").max(80, "İsim çok uzun"),
  description: z.string().trim().max(300, "Açıklama çok uzun").optional().or(z.literal("")),
  position: z.coerce.number().int("Sıra tam sayı olmalı").min(0).max(9999).default(0),
  isActive: z.boolean(),
  // Optional English overrides. Empty strings are dropped by buildTranslations,
  // so clearing a field falls back to Turkish rather than blanking the menu.
  nameEn: z.string().trim().max(120, "İngilizce isim çok uzun").optional().or(z.literal("")),
  descriptionEn: z.string().trim().max(500, "İngilizce açıklama çok uzun").optional().or(z.literal("")),
});

export type CategoryInput = z.infer<typeof categorySchema>;
