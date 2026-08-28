import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";

import { PrintSheet } from "./print-controls";

import { requireUser } from "@/lib/auth";
import { menuUrl, qrTargetUrl, renderQrDataUrl } from "@/lib/qr";
import { getRestaurant } from "@/services/restaurants";

export const metadata: Metadata = { title: "Karekod yazdır" };

/**
 * Printable QR artwork, deliberately outside the (dashboard) route group so the
 * sidebar and navbar never reach the paper.
 *
 * Auth is therefore this page's own job: requireUser plus getRestaurant, which
 * is owner-scoped and returns null for someone else's restaurant — so a guessed
 * id 404s rather than printing a stranger's menu code.
 */
type Props = { params: Promise<{ id: string }> };

export default async function QrPrintPage({ params }: Props) {
  await requireUser();
  const { id } = await params;

  const restaurant = await getRestaurant(id);
  if (!restaurant) notFound();

  // Encodes the ?src=qr variant, so printed codes stay attributable in analytics.
  const target = qrTargetUrl(restaurant.slug);
  const display = menuUrl(restaurant.slug);
  const qr = await renderQrDataUrl(target, 1024);

  const card = (size: "poster" | "card") => (
    <div
      className={
        size === "poster"
          ? "flex flex-col items-center gap-6 rounded-2xl border-2 px-10 py-12 text-center"
          : "flex break-inside-avoid flex-col items-center gap-3 rounded-xl border-2 px-5 py-6 text-center"
      }
    >
      <p className={size === "poster" ? "font-display text-4xl font-bold" : "font-display text-xl font-bold"}>
        {restaurant.name}
      </p>
      <p className={size === "poster" ? "text-lg" : "text-xs"}>Menü için karekodu okutun</p>

      {/* unoptimized: this is a server-generated data: URL, and the optimizer
          would only re-encode something already exactly the right size. */}
      <Image
        src={qr}
        alt={`${restaurant.name} menü karekodu`}
        width={size === "poster" ? 340 : 150}
        height={size === "poster" ? 340 : 150}
        unoptimized
      />

      <p className={size === "poster" ? "text-muted-foreground text-sm" : "text-muted-foreground text-[10px]"}>
        {display.replace(/^https?:\/\//, "")}
      </p>
    </div>
  );

  return (
    <div className="min-h-svh">
      {/* A4 with a sane margin; `exact` keeps the borders and brand colours
          from being dropped by the browser's ink-saving default. */}
      <style>{`
        @page { size: A4; margin: 12mm; }
        @media print {
          html, body { background: #fff; }
          .print-sheet { padding: 0 !important; }
          * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>

      <PrintSheet
        poster={
          <div className="print-sheet mx-auto w-full max-w-3xl p-4">
            <div className="mx-auto max-w-lg">{card("poster")}</div>
          </div>
        }
        cards={
          <div className="print-sheet mx-auto w-full max-w-3xl p-4">
            <div className="grid grid-cols-2 gap-4">
              {[0, 1, 2, 3].map((i) => (
                <div key={i}>{card("card")}</div>
              ))}
            </div>
            <p className="text-muted-foreground mt-4 text-center text-xs print:hidden">
              Dört kart tek sayfada — yazdırdıktan sonra kesip masalara koyabilirsiniz.
            </p>
          </div>
        }
      />
    </div>
  );
}
