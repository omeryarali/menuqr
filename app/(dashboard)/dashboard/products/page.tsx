import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { PageHeader } from "@/components/dashboard/page-header";
import { ProductDialog } from "@/components/dashboard/product-dialog";
import { RestaurantSwitcher } from "@/components/dashboard/restaurant-switcher";
import { SortableProductList, type ProductGroup } from "@/components/dashboard/sortable-product-list";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { listCategories } from "@/services/categories";
import { listProducts } from "@/services/products";
import { listRestaurants } from "@/services/restaurants";

export const metadata: Metadata = { title: "Ürünler" };

type Props = { searchParams: Promise<{ restaurant?: string }> };

export default async function ProductsPage({ searchParams }: Props) {
  const { restaurant: restaurantFilter } = await searchParams;

  const [restaurants, categories, products] = await Promise.all([
    listRestaurants(),
    listCategories(restaurantFilter),
    listProducts({ restaurantId: restaurantFilter }),
  ]);

  if (restaurants.length === 0) {
    return (
      <>
        <PageHeader title="Ürünler" />
        <EmptyState
          title="Önce bir restoran oluşturun"
          description="Ürünler bir kategoriye, kategoriler de bir restorana bağlıdır."
          action={
            <Button render={<Link href="/dashboard/restaurants/new" />} className="mt-2">
              Restoran oluştur
            </Button>
          }
        />
      </>
    );
  }

  // Grouped by category because `position` orders products *within* a category —
  // a flat cross-category list would make a drag's new position meaningless.
  // Categories are already position-sorted by the service, so the groups come
  // out in menu order. Currency is per-restaurant, never global.
  const restaurantById = new Map(restaurants.map((r) => [r.id, r]));

  const groups: ProductGroup[] = categories
    .map((category) => {
      const restaurant = restaurantById.get(category.restaurant_id);
      return {
        category,
        restaurantName: restaurant?.name ?? "—",
        currency: restaurant?.currency ?? "TRY",
        products: products.filter((product) => product.category_id === category.id),
      };
    })
    // An empty category is just noise on this screen; the dialog is how you add
    // the first product to one.
    .filter((group) => group.products.length > 0);

  return (
    <>
      <PageHeader
        title="Ürünler"
        description="Menünüzdeki ürünler."
        action={<ProductDialog categories={categories} nextPosition={products.length} />}
      />

      <Suspense fallback={<Skeleton className="h-10 w-64" />}>
        <RestaurantSwitcher restaurants={restaurants} />
      </Suspense>

      {categories.length === 0 ? (
        <EmptyState
          title="Henüz kategori yok"
          description="Ürünler için önce kategori gerekir."
          action={
            <Button render={<Link href="/dashboard/categories" />} className="mt-2" variant="outline">
              Kategorilere git
            </Button>
          }
        />
      ) : products.length === 0 ? (
        <EmptyState title="Henüz ürün yok" description="İlk menü ürününüzü ekleyin." />
      ) : (
        <SortableProductList groups={groups} categories={categories} />
      )}
    </>
  );
}
