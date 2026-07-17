import { z } from "zod";

export const categorySchema = z.object({
  restaurantId: z.string().uuid("Bir restoran seçin"),
  name: z.string().trim().min(1, "İsim gerekli").max(80, "İsim çok uzun"),
  description: z.string().trim().max(300, "Açıklama çok uzun").optional().or(z.literal("")),
  position: z.coerce.number().int("Sıra tam sayı olmalı").min(0).max(9999).default(0),
  isActive: z.boolean(),
});

export type CategoryInput = z.infer<typeof categorySchema>;
