import { z } from "zod";

/**
 * Fail at boot with a readable message instead of at the first query with
 * "Invalid API key". NEXT_PUBLIC_* vars must be referenced as full literals so
 * the Next build can inline them.
 */
const schema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url("NEXT_PUBLIC_SUPABASE_URL must be a full URL"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, "NEXT_PUBLIC_SUPABASE_ANON_KEY is required"),
  // Trailing slash stripped on purpose: every consumer builds `${SITE_URL}/path`,
  // so a pasted "https://host/" would produce "https://host//path". That
  // double slash 308-redirects for pages but can fail Supabase's redirect
  // allow-list match for auth emails — and a printed QR pointing at it is
  // permanent. Normalize once here so no caller has to care.
  NEXT_PUBLIC_SITE_URL: z
    .string()
    .url("NEXT_PUBLIC_SITE_URL must be a full URL")
    .transform((value) => value.replace(/\/+$/, "")),
});

const parsed = schema.safeParse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
});

if (!parsed.success) {
  const details = parsed.error.issues.map((issue) => `  - ${issue.message}`).join("\n");
  throw new Error(`Invalid environment configuration:\n${details}\n\nCopy .env.example to .env.local and fill it in.`);
}

export const env = parsed.data;
