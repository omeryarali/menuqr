import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ExternalLink } from "lucide-react";

import { PageHeader } from "@/components/dashboard/page-header";
import { RestaurantForm } from "@/components/dashboard/restaurant-form";
import { DeleteDialog } from "@/components/shared/delete-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { deleteRestaurant, updateRestaurant } from "@/lib/actions/restaurants";
import { countRestaurantChildren, getRestaurant } from "@/services/restaurants";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const restaurant = await getRestaurant(id);
  return { title: restaurant?.name ?? "Restoran" };
}

export default async function RestaurantDetailPage({ params }: Props) {
  const { id } = await params;
  const restaurant = await getRestaurant(id);

  // RLS returns null for someone else's restaurant just as it does for a
  // nonexistent one, so 404 is the correct — and non-leaking — answer to both.
  if (!restaurant) notFound();

  const counts = await countRestaurantChildren(id);

  return (
    <>
      <PageHeader
        title={restaurant.name}
        description={`/menu/${restaurant.slug}`}
        action={
          restaurant.is_published ? (
            <Button
              variant="outline"
              render={<Link href={`/menu/${restaurant.slug}`} target="_blank" rel="noreferrer" />}
            >
              <ExternalLink className="size-4" aria-hidden />
              Menüyü görüntüle
            </Button>
          ) : null
        }
      />

      <Card className="max-w-3xl">
        <CardContent className="pt-6">
          {/* bind() produces a Server Action reference the client form can call
              without exposing the id as a form field. */}
          <RestaurantForm action={updateRestaurant.bind(null, id)} restaurant={restaurant} />
        </CardContent>
      </Card>

      <Card className="border-destructive/40 max-w-3xl">
        <CardHeader>
          <CardTitle className="text-base">Bu restoranı sil</CardTitle>
          {/* Türkçe'de sayıdan sonra çoğul eki gelmediği için İngilizce'deki
              tekil/çoğul dallanmasına gerek yok. */}
          <CardDescription>
            Restoranı, {counts.categories} kategori ve {counts.products} ürünle birlikte kalıcı olarak
            siler. Menü adresi anında çalışmayı bırakır.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DeleteDialog
            onConfirm={deleteRestaurant.bind(null, id)}
            triggerVariant="destructive"
            triggerLabel="Restoranı sil"
            title={`${restaurant.name} silinsin mi?`}
            description={`Bu işlem geri alınamaz. ${counts.categories} kategori ve ${counts.products} ürün de silinecek.`}
          />
        </CardContent>
      </Card>
    </>
  );
}
