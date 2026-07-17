import type { Metadata } from "next";
import Link from "next/link";

import { PageHeader } from "@/components/dashboard/page-header";
import { QrCard } from "@/components/dashboard/qr-card";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { env } from "@/lib/env";
import { renderQrDataUrl } from "@/lib/qr";
import { listRestaurants } from "@/services/restaurants";

export const metadata: Metadata = { title: "Karekodlar" };

export default async function QrCodesPage() {
  const restaurants = await listRestaurants();

  // Previews are rendered server-side, in parallel. Cheap enough at MVP scale;
  // if the restaurant count grows, move this behind Suspense per card.
  const cards = await Promise.all(
    restaurants.map(async (restaurant) => {
      const menuUrl = `${env.NEXT_PUBLIC_SITE_URL}/menu/${restaurant.slug}`;
      return {
        ...restaurant,
        menuUrl,
        previewDataUrl: await renderQrDataUrl(menuUrl),
      };
    }),
  );

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
              name={card.name}
              slug={card.slug}
              menuUrl={card.menuUrl}
              previewDataUrl={card.previewDataUrl}
              isPublished={card.is_published}
            />
          ))}
        </div>
      )}
    </>
  );
}
