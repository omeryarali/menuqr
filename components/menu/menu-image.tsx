"use client";

import { useState } from "react";

/**
 * Product thumbnail for the public menu.
 *
 * Plain <img>, not next/image: image_url is an arbitrary external host and
 * image optimization is out of scope, so this avoids next.config remotePatterns
 * and the optimizer proxy. Hides itself if the URL fails to load, so a broken
 * link leaves a clean text row instead of a broken-image icon.
 */
export function MenuImage({ src, alt }: { src: string; alt: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;

  // Deliberate <img>: arbitrary external hosts + optimization is out of scope.
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
      className="size-16 shrink-0 rounded-lg border object-cover sm:size-20"
      style={{ borderColor: "var(--menu-border)" }}
    />
  );
}
