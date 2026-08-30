"use client";

import { useMenuGallery } from "@/components/menu/menu-gallery";
import type { MenuStrings } from "@/lib/i18n";

/**
 * Product description on the menu, clamped to two lines and clickable to read
 * the rest in the detail modal.
 *
 * Falls back to plain text when the product isn't in the gallery, so nothing
 * advertises a tap target that does nothing.
 */
export function ProductDescription({
  productId,
  text,
  strings,
}: {
  productId: string;
  text: string;
  strings: MenuStrings;
}) {
  const { open, hasItem } = useMenuGallery();

  const className = "mt-1 max-w-prose text-sm leading-relaxed text-pretty";
  const style = { color: "var(--menu-muted)" };

  if (!hasItem(productId)) {
    return (
      <p className={className} style={style}>
        {text}
      </p>
    );
  }

  return (
    <button
      type="button"
      onClick={() => open(productId)}
      className={`${className} line-clamp-2 cursor-pointer text-left hover:underline`}
      style={style}
      aria-label={strings.openDetails}
    >
      {text}
    </button>
  );
}
