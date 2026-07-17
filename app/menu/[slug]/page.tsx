import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { MenuHeader } from "@/components/menu/menu-header";
import { MenuSection } from "@/components/menu/menu-section";
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

  return (
    <div className="mx-auto flex min-h-svh w-full max-w-2xl flex-col gap-8 px-4 py-8">
      {!menu.is_published ? (
        <p className="rounded-md border border-dashed px-3 py-2 text-center text-xs">
          Taslak önizleme — bunu yalnızca siz görüyorsunuz. Herkese açmak için restoranı yayınlayın.
        </p>
      ) : null}

      <MenuHeader restaurant={menu} />

      {menu.categories.length === 0 ? (
        <p className="text-muted-foreground py-12 text-center text-sm">
          Bu menü güncelleniyor. Lütfen kısa süre sonra tekrar bakın.
        </p>
      ) : (
        <main className="flex flex-col gap-8">
          {menu.categories.map((category) => (
            <MenuSection key={category.id} category={category} currency={menu.currency} />
          ))}
        </main>
      )}

      <footer className="text-muted-foreground mt-auto pt-8 text-center text-xs">
        MenuQR ile hazırlandı
      </footer>
    </div>
  );
}
