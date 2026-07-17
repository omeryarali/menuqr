import "server-only";

import { redirect } from "next/navigation";

import type { User } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/database";

/**
 * The signed-in user, or null.
 *
 * Always getUser() — never getSession(). getSession() decodes the cookie
 * without verifying it against the auth server, so it can be forged. Middleware
 * gates routes, but Server Components must not rely on that alone: middleware
 * doesn't run for every rendering path.
 */
export async function getCurrentUser(): Promise<User | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/** getCurrentUser, but redirects to /login instead of returning null. */
export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function getProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const user = await getCurrentUser();
  if (!user) return null;

  const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  if (error) throw new Error(`Failed to load profile: ${error.message}`);
  return data;
}
