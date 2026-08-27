"use client";

import { useMenuGallery } from "@/components/menu/menu-gallery";

/**
 * Product name on the menu, clickable to open the detail modal.
 *
 * Rendered as a heading either way so the menu's document outline doesn't
 * change depending on whether the gallery is available; only the inner element
 * becomes a button.
 */
export function ProductName({ productId, name }: { productId: string; name: string }) {
  const { open, hasItem } = useMenuGallery();
  const style = { fontFamily: "var(--menu-heading-font)" };

  if (!hasItem(productId)) {
    return (
      <h3 className="font-medium" style={style}>
        {name}
      </h3>
    );
  }

  return (
    <h3 className="font-medium" style={style}>
      <button
        type="button"
        onClick={() => open(productId)}
        className="cursor-pointer text-left hover:underline"
        aria-label={`${name} — ayrıntıları aç`}
      >
        {name}
      </button>
    </h3>
  );
}
