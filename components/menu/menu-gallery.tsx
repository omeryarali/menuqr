"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

import { ChevronLeft, ChevronRight, Star, X } from "lucide-react";

import { formatPrice } from "@/lib/utils/format";

export type GalleryItem = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  isAvailable: boolean;
  isFeatured: boolean;
};

type GalleryContextValue = {
  open: (productId: string) => void;
  hasItem: (productId: string) => boolean;
};

const GalleryContext = createContext<GalleryContextValue | null>(null);

/**
 * Opens the product detail modal. Safe to call from anywhere under the
 * provider; outside it, `open` is a no-op so a stray usage can't crash the
 * customer's menu.
 */
export function useMenuGallery(): GalleryContextValue {
  return useContext(GalleryContext) ?? { open: () => {}, hasItem: () => false };
}

/**
 * Detail modal for the public menu: a photo lightbox and the "read the full
 * description" popup are the same surface, because on a menu they answer the
 * same question — "what exactly is this dish?".
 *
 * Rendered inline rather than portalled to <body> on purpose. The themes are
 * CSS variables scoped to [data-menu-theme], so a portalled modal would escape
 * them and render with the wrong palette.
 */
export function MenuGalleryProvider({
  items,
  currency,
  children,
}: {
  items: GalleryItem[];
  currency: string;
  children: React.ReactNode;
}) {
  const [index, setIndex] = useState<number | null>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const lastFocused = useRef<HTMLElement | null>(null);

  const ids = useMemo(() => items.map((item) => item.id), [items]);

  const open = useCallback(
    (productId: string) => {
      const next = ids.indexOf(productId);
      if (next === -1) return;
      lastFocused.current = document.activeElement as HTMLElement | null;
      setIndex(next);
    },
    [ids],
  );

  const hasItem = useCallback((productId: string) => ids.includes(productId), [ids]);

  const close = useCallback(() => {
    setIndex(null);
    // Send focus back where it came from, or a keyboard user is dumped at the
    // top of the document.
    lastFocused.current?.focus?.();
  }, []);

  const step = useCallback(
    (delta: number) => {
      setIndex((current) => {
        if (current === null || items.length === 0) return current;
        // Wraps, so arrow keys never dead-end at the first or last dish.
        return (current + delta + items.length) % items.length;
      });
    },
    [items.length],
  );

  const isOpen = index !== null;

  useEffect(() => {
    if (!isOpen) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") close();
      else if (event.key === "ArrowRight") step(1);
      else if (event.key === "ArrowLeft") step(-1);
    }

    document.addEventListener("keydown", onKeyDown);
    // Stop the menu scrolling behind the overlay on touch devices.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButton.current?.focus();

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen, close, step]);

  const item = index === null ? null : items[index];

  return (
    <GalleryContext.Provider value={{ open, hasItem }}>
      {children}

      {item ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={item.name}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          // Only the backdrop closes — a click that started inside the card and
          // ended outside (text selection) must not dismiss it.
          onClick={(event) => {
            if (event.target === event.currentTarget) close();
          }}
        >
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" aria-hidden />

          <div
            className="relative z-10 max-h-[90svh] w-full max-w-lg overflow-y-auto rounded-2xl border shadow-2xl"
            style={{
              backgroundColor: "var(--menu-bg)",
              borderColor: "var(--menu-border)",
              color: "var(--menu-fg)",
            }}
          >
            <button
              ref={closeButton}
              type="button"
              onClick={close}
              className="absolute right-3 top-3 z-10 rounded-full p-2 backdrop-blur transition-opacity hover:opacity-80"
              style={{ backgroundColor: "var(--menu-bg)", border: "1px solid var(--menu-border)" }}
            >
              <X className="size-4" aria-hidden />
              <span className="sr-only">Kapat</span>
            </button>

            {item.imageUrl ? (
              // Plain <img>: the src may be an arbitrary pasted host, and this
              // is a one-off large view rather than a repeated thumbnail.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={item.imageUrl}
                alt={item.name}
                className="max-h-[50svh] w-full rounded-t-2xl object-cover"
              />
            ) : null}

            <div className="space-y-3 p-5">
              <div className="flex items-baseline justify-between gap-3">
                <h2
                  className="text-xl"
                  style={{
                    fontFamily: "var(--menu-heading-font)",
                    fontWeight: "var(--menu-heading-weight)" as React.CSSProperties["fontWeight"],
                    letterSpacing: "var(--menu-heading-tracking)",
                  }}
                >
                  {item.name}
                </h2>
                <span
                  className="shrink-0 font-medium tabular-nums"
                  style={{ color: "var(--menu-accent)", fontFamily: "var(--menu-heading-font)" }}
                >
                  {formatPrice(item.price, currency)}
                </span>
              </div>

              {item.isFeatured ? (
                <p
                  className="inline-flex items-center gap-1 text-xs"
                  style={{ color: "var(--menu-accent)" }}
                >
                  <Star className="size-3 fill-current" aria-hidden />
                  Şefin önerisi
                </p>
              ) : null}

              {!item.isAvailable ? (
                <p className="text-xs" style={{ color: "var(--menu-muted)" }}>
                  Şu anda tükendi.
                </p>
              ) : null}

              {item.description ? (
                <p className="text-sm leading-relaxed text-pretty" style={{ color: "var(--menu-muted)" }}>
                  {item.description}
                </p>
              ) : null}

              {items.length > 1 ? (
                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => step(-1)}
                    className="inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-sm transition-opacity hover:opacity-80"
                    style={{ borderColor: "var(--menu-border)" }}
                  >
                    <ChevronLeft className="size-4" aria-hidden />
                    Önceki
                  </button>
                  <span className="text-xs tabular-nums" style={{ color: "var(--menu-muted)" }}>
                    {(index ?? 0) + 1} / {items.length}
                  </span>
                  <button
                    type="button"
                    onClick={() => step(1)}
                    className="inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-sm transition-opacity hover:opacity-80"
                    style={{ borderColor: "var(--menu-border)" }}
                  >
                    Sonraki
                    <ChevronRight className="size-4" aria-hidden />
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </GalleryContext.Provider>
  );
}
