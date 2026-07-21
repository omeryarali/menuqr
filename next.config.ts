import type { NextConfig } from "next";

/**
 * Security response headers, applied to every route.
 *
 * Deliberately NOT setting a full Content-Security-Policy yet: a correct CSP for
 * this stack needs per-request nonces (Next injects inline bootstrap scripts)
 * and careful per-route testing, and a wrong one white-screens the app. The
 * headers below are the high-value, low-risk subset. CSP is a tracked follow-up.
 */
const securityHeaders = [
  // Clickjacking: the authenticated dashboard must never be framed cross-origin
  // (an attacker could frame it and trick a logged-in owner into clicking a
  // destructive action). SAMEORIGIN keeps full protection; relax per-route later
  // if the public menu ever needs to be embeddable.
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // No feature this app uses; deny them so a compromised script can't either.
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
  // Force HTTPS for two years incl. subdomains. Vercel already serves HTTPS;
  // this also protects a future custom domain.
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
