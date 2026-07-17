import { z } from "zod";

export const productSchema = z.object({
  categoryId: z.string().uuid("Bir kategori seçin"),
  name: z.string().trim().min(1, "İsim gerekli").max(120, "İsim çok uzun"),
  description: z.string().trim().max(500, "Açıklama çok uzun").optional().or(z.literal("")),
  // Postgres'te numeric(10,2): sessizce yuvarlanacak değerleri baştan reddet.
  price: z.coerce
    .number({ error: "Fiyat sayı olmalı" })
    .min(0, "Fiyat negatif olamaz")
    .max(99_999_999.99, "Fiyat çok büyük")
    .refine((value) => Number.isFinite(value) && Math.round(value * 100) === value * 100, {
      message: "Fiyat en fazla 2 ondalık basamak içerebilir",
    }),
  imageUrl: z.string().trim().url("Geçerli bir görsel adresi girin").optional().or(z.literal("")),
  isAvailable: z.boolean(),
  position: z.coerce.number().int("Sıra tam sayı olmalı").min(0).max(9999).default(0),
});

export type ProductInput = z.infer<typeof productSchema>;
