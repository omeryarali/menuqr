import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { PageHeader } from "@/components/dashboard/page-header";
import { ProductDialog } from "@/components/dashboard/product-dialog";
import { RestaurantSwitcher } from "@/components/dashboard/restaurant-switcher";
import { DeleteDialog } from "@/components/shared/delete-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { deleteProduct } from "@/lib/actions/products";
import { formatPrice } from "@/lib/utils/format";
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

  // Currency is per-restaurant, so a product's price must be formatted with its
  // own restaurant's currency — not a single global one.
  const currencyByRestaurant = new Map(restaurants.map((r) => [r.id, r.currency]));

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
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>İsim</TableHead>
                <TableHead className="hidden md:table-cell">Kategori</TableHead>
                <TableHead>Fiyat</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead className="w-24 text-right">İşlemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <p className="font-medium">{product.name}</p>
                    {product.description ? (
                      <p className="text-muted-foreground line-clamp-1 text-sm">{product.description}</p>
                    ) : null}
                  </TableCell>
                  <TableCell className="text-muted-foreground hidden md:table-cell">
                    {product.category?.name ?? "—"}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {formatPrice(product.price, currencyByRestaurant.get(product.restaurant_id))}
                  </TableCell>
                  <TableCell>
                    <Badge variant={product.is_available ? "default" : "secondary"}>
                      {product.is_available ? "Mevcut" : "Tükendi"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end">
                      <ProductDialog categories={categories} product={product} />
                      <DeleteDialog
                        onConfirm={deleteProduct.bind(null, product.id)}
                        iconOnly
                        triggerLabel={`${product.name} ürününü sil`}
                        title={`${product.name} silinsin mi?`}
                        description="Bu işlem geri alınamaz."
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </>
  );
}
