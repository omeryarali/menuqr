"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { env } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  updatePasswordSchema,
} from "@/lib/validators/auth";

import { errorState, type ActionState } from "./types";

/** Only allow same-origin relative paths — `next` comes from the query string. */
function safeRedirect(next: FormDataEntryValue | null): string {
  const value = typeof next === "string" ? next : "";
  if (value.startsWith("/") && !value.startsWith("//")) return value;
  return "/dashboard";
}

export async function login(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return errorState("Aşağıdaki alanları kontrol edin.", parsed.error.flatten().fieldErrors);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    // Deliberately vague: distinguishing "no such user" from "wrong password"
    // turns this form into an account-enumeration oracle.
    return errorState("E-posta veya şifre hatalı.");
  }

  revalidatePath("/", "layout");
  redirect(safeRedirect(formData.get("next")));
}

export async function register(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = registerSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return errorState("Aşağıdaki alanları kontrol edin.", parsed.error.flatten().fieldErrors);
  }

  const { email, password, fullName } = parsed.data;
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      // Read by the handle_new_user trigger to seed profiles.full_name.
      data: { full_name: fullName },
      emailRedirectTo: `${env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  });

  if (error) {
    return errorState(error.message);
  }

  // With email confirmation ON, Supabase returns a user with no session and an
  // empty identities array for an address that already exists, rather than an
  // error. Treat that as "check your email" so we don't leak the address.
  if (data.user && data.user.identities?.length === 0) {
    return { status: "success", message: "Hesabınızı doğrulamak için e-postanızı kontrol edin." };
  }

  if (!data.session) {
    return { status: "success", message: "Hesap oluşturuldu. Doğrulamak için e-postanızı kontrol edin." };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function forgotPassword(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = forgotPasswordSchema.safeParse({ email: formData.get("email") });

  if (!parsed.success) {
    return errorState("Aşağıdaki alanları kontrol edin.", parsed.error.flatten().fieldErrors);
  }

  const supabase = await createClient();

  // The link lands on /auth/callback, which exchanges the code for a session
  // and then forwards to the update-password page. Both this URL and the
  // production equivalent must be in Supabase's redirect allow list.
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${env.NEXT_PUBLIC_SITE_URL}/auth/callback?next=/update-password`,
  });

  // Supabase succeeds even for unknown addresses, so a real error here is
  // operational (rate limit, SMTP down) — not "no such account". Keep the
  // message generic either way; this form must not confirm which emails exist.
  if (error) {
    return errorState("Bağlantı gönderilemedi. Lütfen birkaç dakika sonra tekrar deneyin.");
  }

  return {
    status: "success",
    message: "Bu adrese kayıtlı bir hesap varsa şifre sıfırlama bağlantısı gönderdik. Gelen kutunuzu kontrol edin.",
  };
}

export async function updatePassword(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = updatePasswordSchema.safeParse({ password: formData.get("password") });

  if (!parsed.success) {
    return errorState("Aşağıdaki alanları kontrol edin.", parsed.error.flatten().fieldErrors);
  }

  const supabase = await createClient();

  // The recovery link created this session via /auth/callback. If it's gone
  // (expired link, cookies cleared), updateUser would fail anyway — fail early
  // with a message that tells the user what to actually do.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return errorState("Oturumunuz zaman aşımına uğradı. Yeni bir sıfırlama bağlantısı isteyin.");
  }

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });

  if (error) {
    if (error.code === "same_password") {
      return errorState("Yeni şifreniz eskisinden farklı olmalı.");
    }
    return errorState("Şifre güncellenemedi. Lütfen tekrar deneyin.");
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function logout(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
