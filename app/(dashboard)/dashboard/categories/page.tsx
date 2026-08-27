import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { CategoryDialog } from "@/components/dashboard/category-dialog";
import { PageHeader } from "@/components/dashboard/page-header";
import { RestaurantSwitcher } from "@/components/dashboard/restaurant-switcher";
import { SortableCategoryList } from "@/components/dashboard/sortable-category-list";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { listCategories } from "@/services/categories";
import { listRestaurants } from "@/services/restaurants";

export const metadata: Metadata = { title: "Kategoriler" };

type Props = { searchParams: Promise<{ restaurant?: string }> };

export default async function CategoriesPage({ searchParams }: Props) {
  const { restaurant: restaurantFilter } = await searchParams;

  const [restaurants, categories] = await Promise.all([
    listRestaurants(),
    listCategories(restaurantFilter),
  ]);

  const nextPosition = categories.length;

  if (restaurants.length === 0) {
    return (
      <>
        <PageHeader title="Kategoriler" />
        <EmptyState
          title="Önce bir restoran oluşturun"
          description="Kategoriler bir restorana ait olduğu için önce restoran gerekir."
          action={
            <Button render={<Link href="/dashboard/restaurants/new" />} className="mt-2">
              Restoran oluştur
            </Button>
          }
        />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Kategoriler"
        description="Ürünlerinizi bölümlere ayırın."
        action={
          <CategoryDialog
            restaurants={restaurants}
            defaultRestaurantId={restaurantFilter}
            nextPosition={nextPosition}
          />
        }
      />

      <Suspense fallback={<Skeleton className="h-10 w-64" />}>
        <RestaurantSwitcher restaurants={restaurants} />
      </Suspense>

      {categories.length === 0 ? (
        <EmptyState title="Henüz kategori yok" description="Başlangıçlar, Ana Yemekler veya İçecekler gibi bir kategori ekleyin." />
      ) : (
        <SortableCategoryList categories={categories} restaurants={restaurants} />
      )}
    </>
  );
}
