import { NextResponse, type NextRequest } from "next/server";

import type { EmailOtpType } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";

/**
 * Email-confirmation / password-recovery / OAuth landing point.
 *
 * Supabase can deliver the verification two different ways depending on project
 * config, so handle both rather than betting on one:
 *   - PKCE:        ?code=…            -> exchangeCodeForSession
 *   - token hash:  ?token_hash=&type= -> verifyOtp
 * It can also bounce here with ?error=&error_description= (expired/used link);
 * surface that on /login instead of a blank "missing_code".
 *
 * Cookies are written by the server client via next/headers, which is allowed
 * in a Route Handler (unlike a Server Component).
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;

  const errorDescription = searchParams.get("error_description") ?? searchParams.get("error");
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  const nextParam = searchParams.get("next");
  const next = nextParam?.startsWith("/") && !nextParam.startsWith("//") ? nextParam : "/dashboard";

  const toLogin = (reason: string) =>
    NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(reason)}`);

  // The link itself reported a failure (most often: expired or already used).
  if (errorDescription) {
    return toLogin(errorDescription);
  }

  const supabase = await createClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) return toLogin(error.message);
    return NextResponse.redirect(`${origin}${next}`);
  }

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (error) return toLogin(error.message);
    return NextResponse.redirect(`${origin}${next}`);
  }

  return toLogin("Doğrulama bağlantısı geçersiz veya süresi dolmuş.");
}
