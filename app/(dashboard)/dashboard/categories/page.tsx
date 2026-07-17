import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { CategoryDialog } from "@/components/dashboard/category-dialog";
import { PageHeader } from "@/components/dashboard/page-header";
import { RestaurantSwitcher } from "@/components/dashboard/restaurant-switcher";
import { DeleteDialog } from "@/components/shared/delete-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { deleteCategory } from "@/lib/actions/categories";
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

  const restaurantNames = new Map(restaurants.map((r) => [r.id, r.name]));
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
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">#</TableHead>
                <TableHead>İsim</TableHead>
                <TableHead className="hidden md:table-cell">Restoran</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead className="w-24 text-right">İşlemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((category) => (
                <TableRow key={category.id}>
                  <TableCell className="text-muted-foreground">{category.position}</TableCell>
                  <TableCell>
                    <p className="font-medium">{category.name}</p>
                    {category.description ? (
                      <p className="text-muted-foreground line-clamp-1 text-sm">{category.description}</p>
                    ) : null}
                  </TableCell>
                  <TableCell className="text-muted-foreground hidden md:table-cell">
                    {restaurantNames.get(category.restaurant_id) ?? "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={category.is_active ? "default" : "secondary"}>
                      {category.is_active ? "Görünür" : "Gizli"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end">
                      <CategoryDialog restaurants={restaurants} category={category} />
                      <DeleteDialog
                        onConfirm={deleteCategory.bind(null, category.id)}
                        iconOnly
                        triggerLabel={`${category.name} kategorisini sil`}
                        title={`${category.name} silinsin mi?`}
                        description="Bu kategorideki tüm ürünler de silinir. Bu işlem geri alınamaz."
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
