import { z } from "zod";

/** 0001_init.sql içindeki slug CHECK kısıtının birebir karşılığı. */
export const slugSchema = z
  .string()
  .trim()
  .min(3, "Menü adresi en az 3 karakter olmalı")
  .max(60, "Menü adresi en fazla 60 karakter olabilir")
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Sadece küçük harf, rakam ve tek tire kullanın");

export const restaurantSchema = z.object({
  name: z.string().trim().min(1, "İsim gerekli").max(120, "İsim çok uzun"),
  slug: slugSchema,
  description: z.string().trim().max(500, "Açıklama çok uzun").optional().or(z.literal("")),
  address: z.string().trim().max(255, "Adres çok uzun").optional().or(z.literal("")),
  phone: z.string().trim().max(32, "Telefon çok uzun").optional().or(z.literal("")),
  currency: z.string().trim().length(3, "3 harfli para birimi kodu girin").toUpperCase(),
  isPublished: z.boolean(),
});

export type RestaurantInput = z.infer<typeof restaurantSchema>;
