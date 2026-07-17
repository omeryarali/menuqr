import { z } from "zod";

const emailSchema = z.string().min(1, "E-posta gerekli").email("Geçerli bir e-posta adresi girin");

/** Kayıt ve şifre yenileme aynı kuralları paylaşır — tek yerden değişir. */
const passwordSchema = z
  .string()
  .min(8, "Şifre en az 8 karakter olmalı")
  .max(72, "Şifre en fazla 72 karakter olabilir") // bcrypt 72 bayttan sonrasını yok sayar
  .regex(/[a-z]/, "Şifre en az bir küçük harf içermeli")
  .regex(/[A-Z]/, "Şifre en az bir büyük harf içermeli")
  .regex(/[0-9]/, "Şifre en az bir rakam içermeli");

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Şifre gerekli"),
});

export const registerSchema = z.object({
  fullName: z.string().trim().min(2, "Ad soyad en az 2 karakter olmalı").max(80, "Ad soyad çok uzun"),
  email: emailSchema,
  password: passwordSchema,
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const updatePasswordSchema = z.object({
  password: passwordSchema,
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type UpdatePasswordInput = z.infer<typeof updatePasswordSchema>;
