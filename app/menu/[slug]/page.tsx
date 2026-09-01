import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { LanguageSwitcher } from "@/components/menu/language-switcher";
import { MenuGalleryProvider, type GalleryItem } from "@/components/menu/menu-gallery";
import { MenuHeader } from "@/components/menu/menu-header";
import { MenuJsonLd } from "@/components/menu/menu-json-ld";
import { MenuSection } from "@/components/menu/menu-section";
import { MenuTracker } from "@/components/menu/menu-tracker";
import { env } from "@/lib/env";
import { BASE_LOCALE, localize, menuStrings, metaDescription, resolveLocale } from "@/lib/i18n";
import { resolveTheme } from "@/lib/themes";
import { getPublicMenu } from "@/services/menu";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ lang?: string }>;
};

/**
 * Rendered dynamically rather than statically cached.
 *
 * The page is personalized by RLS — an owner sees their own unpublished menu as
 * a preview, the public does not. A shared cache entry would leak that draft to
 * the next visitor.
 */
export const dynamic = "force-dynamic";

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const [{ slug }, { lang }] = await Promise.all([params, searchParams]);
  const menu = await getPublicMenu(slug);
  const locale = resolveLocale(lang);
  const s = menuStrings(locale);

  if (!menu) return { title: locale === BASE_LOCALE ? "Menü bulunamadı" : "Menu not found" };

  const base = `${env.NEXT_PUBLIC_SITE_URL}/menu/${menu.slug}`;
  const canonical = locale === BASE_LOCALE ? base : `${base}?lang=${locale}`;
  const title = `${menu.name} · ${s.menuSuffix}`;

  return {
    title,
    description: menu.description ?? metaDescription(locale, menu.name),
    alternates: {
      canonical,
      // Tells search engines these are the same menu in two languages rather
      // than duplicate pages competing with each other.
      languages: { tr: base, en: `${base}?lang=en` },
    },
    openGraph: {
      url: canonical,
      title,
      description: menu.description ?? undefined,
      type: "website",
      locale,
    },
    // Draft menus must never reach an index, even if the URL gets shared.
    robots: menu.is_published ? undefined : { index: false, follow: false },
  };
}

export default async function PublicMenuPage({ params, searchParams }: Props) {
  const [{ slug }, { lang }] = await Promise.all([params, searchParams]);
  const menu = await getPublicMenu(slug);

  if (!menu) notFound();

  const theme = resolveTheme(menu.theme);
  const locale = resolveLocale(lang);
  const strings = menuStrings(locale);

  // Flattened in display order, so the modal's prev/next walks the menu the way
  // the customer reads it rather than in database order.
  const galleryItems: GalleryItem[] = menu.categories.flatMap((category) =>
    category.products.map((product) => {
      const text = localize(product, product.translations, locale);
      return {
      id: product.id,
      name: text.name,
      description: text.description,
      price: product.price,
      imageUrl: product.image_url,
      isAvailable: product.is_available,
      isFeatured: product.is_featured,
      };
    }),
  );

  return (
    <div
      data-menu-theme={theme}
      className="relative min-h-svh w-full bg-[var(--menu-bg)] text-[var(--menu-fg)]"
      style={{ fontFamily: "var(--menu-body-font)" }}
    >
      {/* Every category is a native <details> and starts collapsed. Print rules
          live here rather than in a Tailwind `print:` class because the sections
          must open on paper regardless of viewport, and the two selectors cover
          both ways browsers hide the closed content. */}
      <style>{`
        @media print {
          details::details-content {
            content-visibility: visible !important;
            block-size: auto !important;
          }
          details:not([open]) > *:not(summary) { display: block !important; }
          .menu-section-chevron { display: none !important; }
          summary { cursor: auto; }
        }
      `}</style>

      {/* Soft glow behind the header so the page doesn't read as a flat slab. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-72"
        style={{
          background: "radial-gradient(60% 100% at 50% 0%, var(--menu-bg-glow), transparent 70%)",
          opacity: 0.7,
        }}
      />

      {/* Records the visit client-side; the API skips the owner's own previews
          and unpublished menus. Renders nothing. */}
      <MenuTracker slug={menu.slug} />
      <MenuJsonLd menu={menu} />

      <MenuGalleryProvider items={galleryItems} currency={menu.currency} strings={strings}>
        <div className="relative mx-auto flex min-h-svh w-full max-w-2xl flex-col gap-10 px-5 py-10 sm:px-6">
          {!menu.is_published ? (
            <p
              className="rounded-full border px-4 py-2 text-center text-xs"
              style={{ borderColor: "var(--menu-border)", color: "var(--menu-muted)" }}
            >
              Taslak önizleme — bunu yalnızca siz görüyorsunuz. Herkese açmak için restoranı yayınlayın.
            </p>
          ) : null}

          <div className="flex justify-center">
            <LanguageSwitcher current={locale} label={strings.languageLabel} />
          </div>

          <MenuHeader restaurant={menu} strings={strings} />

          {menu.categories.length === 0 ? (
            <p className="py-12 text-center text-sm" style={{ color: "var(--menu-muted)" }}>
              {strings.menuUpdating}
            </p>
          ) : (
            <main className="flex flex-col gap-12">
              {menu.categories.map((category) => (
                <MenuSection
                key={category.id}
                category={category}
                currency={menu.currency}
                locale={locale}
                strings={strings}
                defaultOpen={menu.categories.length === 1}
              />
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
            {strings.poweredBy}
          </footer>
        </div>
      </MenuGalleryProvider>
    </div>
  );
}
