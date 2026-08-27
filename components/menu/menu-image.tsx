"use client";

import Image from "next/image";
import { useState } from "react";

import { useMenuGallery } from "@/components/menu/menu-gallery";
import { isUploadedImage } from "@/lib/storage";

/**
 * Product thumbnail on the public menu. Tap to open the detail modal.
 *
 * Two rendering paths, because photos arrive two ways:
 *   - uploaded to our Supabase bucket -> next/image, which resizes and serves
 *     WebP/AVIF (the host is allowlisted in next.config)
 *   - pasted from an arbitrary site  -> plain <img>, since the optimizer
 *     rejects hosts that aren't allowlisted and would fail the whole image
 *
 * Hides itself if the URL fails to load, so a dead link leaves a clean text row
 * instead of a broken-image icon on a customer's phone.
 */
export function MenuImage({ src, alt, productId }: { src: string; alt: string; productId: string }) {
  const [failed, setFailed] = useState(false);
  const { open, hasItem } = useMenuGallery();

  if (failed) return null;

  const optimized = isUploadedImage(src);
  const clickable = hasItem(productId);

  const inner = optimized ? (
    <Image
      src={src}
      alt={alt}
      width={160}
      height={160}
      // Rendered at 64–80 CSS px; the hint keeps the optimizer from shipping a
      // desktop-sized file to a phone.
      sizes="80px"
      className="size-full object-cover"
      onError={() => setFailed(true)}
    />
  ) : (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
      className="size-full object-cover"
    />
  );

  const frame = "size-16 shrink-0 overflow-hidden rounded-lg border sm:size-20";

  if (!clickable) {
    return (
      <div className={frame} style={{ borderColor: "var(--menu-border)" }}>
        {inner}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => open(productId)}
      className={`${frame} cursor-pointer transition-opacity hover:opacity-85`}
      style={{ borderColor: "var(--menu-border)" }}
      aria-label={`${alt} — büyük görseli aç`}
    >
      {inner}
    </button>
  );
}
