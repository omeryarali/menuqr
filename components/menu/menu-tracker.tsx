"use client";

import { useEffect, useRef } from "react";

/**
 * Records one menu-open event, then renders nothing.
 *
 * Reads the marker straight off window.location instead of useSearchParams so
 * the component needs no Suspense boundary — it renders inside the customer's
 * menu, which should never be delayed for a counter.
 *
 * The ref guard matters: React StrictMode mounts effects twice in development,
 * and without it every local view would be counted as two.
 */
export function MenuTracker({ slug }: { slug: string }) {
  const sent = useRef(false);

  useEffect(() => {
    if (sent.current) return;
    sent.current = true;

    const isQr = new URLSearchParams(window.location.search).get("src") === "qr";

    // keepalive so the request survives the customer immediately navigating
    // away; failures are swallowed because a lost count is not worth an error.
    void fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, eventType: isQr ? "qr_scan" : "view" }),
      keepalive: true,
    }).catch(() => {});
  }, [slug]);

  return null;
}
