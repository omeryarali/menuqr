import type { Metadata } from "next";
import Link from "next/link";

import { Plus } from "lucide-react";

import { PageHeader } from "@/components/dashboard/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { listRestaurants } from "@/services/restaurants";

export const metadata: Metadata = { title: "Restoranlar" };

export default async function RestaurantsPage() {
  const restaurants = await listRestaurants();

  return (
    <>
      <PageHeader
        title="Restoranlar"
        description="Her restoranın kendi menü adresi ve karekodu olur."
        action={
          <Button render={<Link href="/dashboard/restaurants/new" />}>
            <Plus className="size-4" aria-hidden />
            Yeni restoran
          </Button>
        }
      />

      {restaurants.length === 0 ? (
        <EmptyState
          title="Henüz restoran yok"
          description="Menü hazırlamaya başlamak için ilk restoranınızı oluşturun."
          action={
            <Button render={<Link href="/dashboard/restaurants/new" />} className="mt-2">
              Restoran oluştur
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {restaurants.map((restaurant) => (
            <Link key={restaurant.id} href={`/dashboard/restaurants/${restaurant.id}`} className="group">
              <Card className="group-hover:border-primary/40 h-full transition-colors">
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="truncate">{restaurant.name}</CardTitle>
                    <Badge variant={restaurant.is_published ? "default" : "secondary"}>
                      {restaurant.is_published ? "Yayında" : "Taslak"}
                    </Badge>
                  </div>
                  <CardDescription className="truncate">/menu/{restaurant.slug}</CardDescription>
                </CardHeader>
                {restaurant.description ? (
                  <CardContent>
                    <p className="text-muted-foreground line-clamp-2 text-sm">{restaurant.description}</p>
                  </CardContent>
                ) : null}
              </Card>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
