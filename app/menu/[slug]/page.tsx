import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { MenuHeader } from "@/components/menu/menu-header";
import { MenuSection } from "@/components/menu/menu-section";
import { resolveTheme } from "@/lib/themes";
import { getPublicMenu } from "@/services/menu";

type Props = { params: Promise<{ slug: string }> };

/**
 * Rendered dynamically rather than statically cached.
 *
 * The page is personalized by RLS — an owner sees their own unpublished menu as
 * a preview, the public does not. A shared cache entry would leak that draft to
 * the next visitor.
 */
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const menu = await getPublicMenu(slug);

  if (!menu) return { title: "Menü bulunamadı" };

  return {
    title: `${menu.name} · Menü`,
    description: menu.description ?? `${menu.name} menüsünü inceleyin.`,
    openGraph: {
      title: `${menu.name} · Menü`,
      description: menu.description ?? undefined,
      type: "website",
    },
    // Draft menus must never reach an index, even if the URL gets shared.
    robots: menu.is_published ? undefined : { index: false, follow: false },
  };
}

export default async function PublicMenuPage({ params }: Props) {
  const { slug } = await params;
  const menu = await getPublicMenu(slug);

  if (!menu) notFound();

  const theme = resolveTheme(menu.theme);

  return (
    <div
      data-menu-theme={theme}
      className="relative min-h-svh w-full bg-[var(--menu-bg)] text-[var(--menu-fg)]"
      style={{ fontFamily: "var(--menu-body-font)" }}
    >
      {/* Soft glow behind the header so the page doesn't read as a flat slab. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-72"
        style={{
          background: "radial-gradient(60% 100% at 50% 0%, var(--menu-bg-glow), transparent 70%)",
          opacity: 0.7,
        }}
      />

      <div className="relative mx-auto flex min-h-svh w-full max-w-2xl flex-col gap-10 px-5 py-10 sm:px-6">
        {!menu.is_published ? (
          <p
            className="rounded-full border px-4 py-2 text-center text-xs"
            style={{ borderColor: "var(--menu-border)", color: "var(--menu-muted)" }}
          >
            Taslak önizleme — bunu yalnızca siz görüyorsunuz. Herkese açmak için restoranı yayınlayın.
          </p>
        ) : null}

        <MenuHeader restaurant={menu} />

        {menu.categories.length === 0 ? (
          <p className="py-12 text-center text-sm" style={{ color: "var(--menu-muted)" }}>
            Bu menü güncelleniyor. Lütfen kısa süre sonra tekrar bakın.
          </p>
        ) : (
          <main className="flex flex-col gap-12">
            {menu.categories.map((category) => (
              <MenuSection key={category.id} category={category} currency={menu.currency} />
            ))}
          </main>
        )}

        <footer
          className="mt-auto flex items-center justify-center gap-1.5 pt-6 text-center text-xs"
          style={{ color: "var(--menu-muted)" }}
        >
          <span
            className="inline-block size-1.5 rounded-full"
            style={{ backgroundColor: "var(--menu-accent)" }}
          />
          MenuQR ile hazırlandı
        </footer>
      </div>
    </div>
  );
}
