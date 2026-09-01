import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";

import { PrintSheet } from "@/components/dashboard/print-sheet";
import { requireUser } from "@/lib/auth";
import {
  DAY_KEYS,
  DAY_LABELS,
  formatDayHours,
  parseOpeningHours,
} from "@/lib/opening-hours";
import { formatTrPhone } from "@/lib/phone";
import { qrTargetUrl, renderQrDataUrl } from "@/lib/qr";
import { formatPrice } from "@/lib/utils/format";
import { getPublicMenu } from "@/services/menu";
import { getRestaurant } from "@/services/restaurants";

export const metadata: Metadata = { title: "Menüyü yazdır" };

/**
 * Printable paper menu, built from the same data as the digital one — the owner
 * maintains the menu once and gets both.
 *
 * Outside the (dashboard) group so the sidebar never reaches the paper, which
 * makes auth this page's own job: requireUser plus owner-scoped getRestaurant,
 * so a guessed id 404s instead of printing a stranger's menu.
 *
 * Text only, no photos: a paper menu is usually printed in bulk on a mono
 * printer, where images cost a lot and read badly.
 */
type Props = { params: Promise<{ id: string }> };

export default async function MenuPrintPage({ params }: Props) {
  await requireUser();
  const { id } = await params;

  const restaurant = await getRestaurant(id);
  if (!restaurant) notFound();

  // Owner-visible, so this works for an unpublished menu too — printing a
  // proof before going live is a normal thing to want.
  const menu = await getPublicMenu(restaurant.slug);
  if (!menu) notFound();

  const hours = parseOpeningHours(menu.opening_hours);
  const qr = await renderQrDataUrl(qrTargetUrl(menu.slug), 512);

  const header = (
    <header className="mb-6 space-y-2 text-center">
      <h1 className="font-display text-3xl font-bold">{menu.name}</h1>
      {menu.description ? <p className="text-sm">{menu.description}</p> : null}
      {menu.address || menu.phone ? (
        <p className="text-muted-foreground text-xs">
          {[menu.address, formatTrPhone(menu.phone)].filter(Boolean).join(" · ")}
        </p>
      ) : null}
    </header>
  );

  /**
   * `break-inside-avoid` keeps a category from being split across a page
   * break — a section title stranded at the foot of a page is the classic way
   * printed menus look broken.
   */
  const section = (category: (typeof menu.categories)[number]) => (
    <section key={category.id} className="mb-5 break-inside-avoid">
      <h2 className="font-display mb-2 border-b pb-1 text-lg font-bold">{category.name}</h2>
      {category.description ? (
        <p className="text-muted-foreground mb-2 text-xs">{category.description}</p>
      ) : null}

      <ul className="space-y-1.5">
        {category.products.map((product) => (
          <li key={product.id} className="break-inside-avoid text-sm">
            <div className="flex items-baseline gap-2">
              <span className="font-medium">{product.name}</span>
              {product.is_featured ? (
                <span className="shrink-0 text-[0.65rem] whitespace-nowrap">★ Şefin önerisi</span>
              ) : null}
              <span className="relative -top-1 min-w-4 flex-1 border-b border-dotted" aria-hidden />
              <span className="shrink-0 tabular-nums">{formatPrice(product.price, menu.currency)}</span>
            </div>
            {product.description ? (
              <p className="text-muted-foreground text-xs">{product.description}</p>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );

  const footer = (
    <footer className="mt-6 flex items-center justify-center gap-3 border-t pt-4">
      <Image src={qr} alt="Dijital menü karekodu" width={64} height={64} unoptimized />
      <div className="text-xs">
        <p className="font-medium">Güncel menü için karekodu okutun</p>
        {hours ? (
          <p className="text-muted-foreground">
            {DAY_KEYS.map((day) => {
              const value = formatDayHours(hours[day]);
              return value ? `${DAY_LABELS[day].slice(0, 3)} ${value}` : null;
            })
              .filter(Boolean)
              .join(" · ")}
          </p>
        ) : null}
      </div>
    </footer>
  );

  const sheet = (columns: 1 | 2) => (
    <div className="print-sheet mx-auto w-full max-w-3xl p-4">
      {header}
      {/* CSS columns rather than a grid: a menu should flow down one column and
          continue in the next, which grid cannot do.

          A plain class, not Tailwind's `sm:columns-2`: that breakpoint depends
          on the viewport width, and if the print layout measures narrower than
          it, a two-column menu would silently print as one. The rule below
          applies to print unconditionally. */}
      <div className={columns === 2 ? "menu-two-col" : undefined}>
        {menu.categories.map(section)}
      </div>
      {footer}
    </div>
  );

  return (
    <div className="min-h-svh">
      <style>{`
        @page { size: A4; margin: 14mm; }
        /* Two columns whenever there is room on screen, and always on paper. */
        @media screen and (min-width: 640px) {
          .menu-two-col { column-count: 2; column-gap: 2rem; }
        }
        @media print {
          .menu-two-col { column-count: 2; column-gap: 2rem; }
          html, body { background: #fff; }
          .print-sheet { padding: 0 !important; max-width: none !important; }
          * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>

      <PrintSheet
        backHref={`/dashboard/restaurants/${restaurant.id}`}
        backLabel="Restoran"
        options={[
          { value: "one", label: "Tek sütun" },
          { value: "two", label: "İki sütun" },
        ]}
        views={{ one: sheet(1), two: sheet(2) }}
      />
    </div>
  );
}
