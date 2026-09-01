import type { Metadata } from "next";
import Link from "next/link";

import { PageHeader } from "@/components/dashboard/page-header";
import { QrCard } from "@/components/dashboard/qr-card";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { menuUrl, qrTargetUrl, renderFramedQrSvg } from "@/lib/qr";
import { listRestaurants } from "@/services/restaurants";

export const metadata: Metadata = { title: "Karekodlar" };

export default async function QrCodesPage() {
  const restaurants = await listRestaurants();

  // The same SVG string is the preview, the SVG download and the source the
  // card rasterizes the PNG from, so all three are provably the same artwork.
  const cards = restaurants.map((restaurant) => ({
    ...restaurant,
    // Shown and copied: the clean URL. Encoded in the image: the ?src=qr
    // variant, so the preview matches what the download actually contains.
    menuUrl: menuUrl(restaurant.slug),
    qrSvg: renderFramedQrSvg(qrTargetUrl(restaurant.slug)),
  }));

  return (
    <>
      <PageHeader title="Karekodlar" description="Her restoran için karekodu indirip yazdırın." />

      {cards.length === 0 ? (
        <EmptyState
          title="Henüz restoran yok"
          description="Her restoran, menüsüne yönlendiren bir karekod alır."
          action={
            <Button render={<Link href="/dashboard/restaurants/new" />} className="mt-2">
              Restoran oluştur
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((card) => (
            <QrCard
              key={card.id}
              id={card.id}
              name={card.name}
              slug={card.slug}
              menuUrl={card.menuUrl}
              qrSvg={card.qrSvg}
              isPublished={card.is_published}
            />
          ))}
        </div>
      )}
    </>
  );
}
