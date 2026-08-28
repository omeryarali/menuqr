import type { Metadata } from "next";
import Link from "next/link";

import { FolderTree, Plus, Store, UtensilsCrossed } from "lucide-react";

import { PageHeader } from "@/components/dashboard/page-header";
import { ReadinessCard } from "@/components/dashboard/readiness-card";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getProfile } from "@/lib/auth";
import { getRestaurantReadiness } from "@/lib/readiness";
import { listCategories } from "@/services/categories";
import { listProducts } from "@/services/products";
import { listRestaurants } from "@/services/restaurants";

export const metadata: Metadata = { title: "Genel bakış" };

export default async function DashboardPage() {
  const [profile, restaurants, categories, products] = await Promise.all([
    getProfile(),
    listRestaurants(),
    listCategories(),
    listProducts(),
  ]);

  const firstName = profile?.full_name?.split(" ")[0];
  const published = restaurants.filter((restaurant) => restaurant.is_published);

  const stats = [
    { label: "Restoran", value: restaurants.length, icon: Store, href: "/dashboard/restaurants" },
    { label: "Kategori", value: categories.length, icon: FolderTree, href: "/dashboard/categories" },
    { label: "Ürün", value: products.length, icon: UtensilsCrossed, href: "/dashboard/products" },
  ];

  return (
    <>
      <PageHeader
        title={firstName ? `Tekrar hoş geldiniz, ${firstName}` : "Genel bakış"}
        description="Yönettiğiniz her şey tek bakışta."
        action={
          <Button render={<Link href="/dashboard/restaurants/new" />}>
            <Plus className="size-4" aria-hidden />
            Yeni restoran
          </Button>
        }
      />

      {restaurants.length === 0 ? (
        <EmptyState
          title="Hadi başlayalım"
          description="Bir restoran oluşturun, kategori ve ürün ekleyin, sonra yayınlayıp karekodu yazdırın."
          action={
            <Button render={<Link href="/dashboard/restaurants/new" />} className="mt-2">
              İlk restoranınızı oluşturun
            </Button>
          }
        />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            {stats.map(({ label, value, icon: Icon, href }) => (
              <Link key={label} href={href}>
                <Card className="hover:border-primary/40 transition-colors">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-muted-foreground text-sm font-medium">{label}</CardTitle>
                    <span className="bg-primary/10 text-primary flex size-8 items-center justify-center rounded-lg">
                      <Icon className="size-4" aria-hidden />
                    </span>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-semibold tracking-tight">{value}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Restoranlarınız</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {restaurants.map((restaurant) => (
                <ReadinessCard
                  key={restaurant.id}
                  restaurant={restaurant}
                  readiness={getRestaurantReadiness(restaurant, categories, products)}
                />
              ))}
            </CardContent>
          </Card>

          {published.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Henüz hiçbir restoranınız yayında değil — yayınlayana kadar menü adresleri 404 döner.
            </p>
          ) : null}
        </>
      )}
    </>
  );
}
