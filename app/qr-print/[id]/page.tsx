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
  const display = menuUrl(restaurant.slug).replace(/^https?:\/\//, "");
  const qr = await renderQrDataUrl(target, 1024);

  const poster = (
    <div className="flex flex-col items-center gap-6 rounded-2xl border-2 px-10 py-12 text-center">
      <p className="font-display text-4xl font-bold">{restaurant.name}</p>
      <p className="text-lg">Menü için karekodu okutun</p>
      {/* unoptimized: a server-generated data: URL, already the right size. */}
      <Image src={qr} alt={`${restaurant.name} menü karekodu`} width={340} height={340} unoptimized />
      <p className="text-muted-foreground text-sm">{display}</p>
    </div>
  );

  const tableCard = (
    <div className="print-card flex break-inside-avoid flex-col items-center justify-center gap-2 rounded-xl border-2 p-4 text-center">
      <p className="font-display card-name text-lg leading-tight font-bold">{restaurant.name}</p>
      <p className="card-hint text-xs">Menü için karekodu okutun</p>
      <Image
        src={qr}
        alt={`${restaurant.name} menü karekodu`}
        width={150}
        height={150}
        className="card-qr"
        unoptimized
      />
      <p className="text-muted-foreground card-url text-[10px] break-all">{display}</p>
    </div>
  );

  return (
    <div className="min-h-svh">
      {/*
        Six cards, 2 x 3, sized in millimetres so a sheet actually fits A4
        rather than spilling onto a second page.

        A4 is 210 x 297mm; the 12mm page margin leaves 186 x 273mm. Three rows
        of 86mm plus two 4mm gaps = 266mm, which keeps a little slack for
        printers that round the margin up. Heights are fixed here because
        content-driven cards grow with a long restaurant name and would push
        the last row off the page.

        `exact` stops the browser's ink-saving default from dropping the card
        borders, which are the cutting guides.
      */}
      <style>{`
        @page { size: A4; margin: 12mm; }
        @media print {
          html, body { background: #fff; }
          .print-sheet { padding: 0 !important; }
          * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .card-grid { gap: 4mm !important; }
          .print-card { height: 86mm; padding: 3mm; gap: 1.5mm; }
          .print-card .card-qr { width: 46mm !important; height: 46mm !important; }
          .print-card .card-name { font-size: 12pt; }
          .print-card .card-hint { font-size: 7pt; }
          .print-card .card-url { font-size: 6pt; }
        }
      `}</style>

      <PrintSheet
        poster={
          <div className="print-sheet mx-auto w-full max-w-3xl p-4">
            <div className="mx-auto max-w-lg">{poster}</div>
          </div>
        }
        cards={
          <div className="print-sheet mx-auto w-full max-w-3xl p-4">
            <div className="card-grid grid grid-cols-2 gap-4">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <div key={i}>{tableCard}</div>
              ))}
            </div>
            <p className="text-muted-foreground mt-4 text-center text-xs print:hidden">
              Altı kart tek A4 sayfada — yazdırdıktan sonra kenarlardan kesip masalara koyabilirsiniz.
            </p>
          </div>
        }
      />
    </div>
  );
}
