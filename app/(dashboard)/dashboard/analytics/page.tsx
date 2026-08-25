import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { Eye, QrCode, TrendingUp } from "lucide-react";

import { AnalyticsChart } from "@/components/dashboard/analytics-chart";
import { PageHeader } from "@/components/dashboard/page-header";
import { RestaurantSwitcher } from "@/components/dashboard/restaurant-switcher";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getAnalyticsOverview } from "@/services/analytics";
import { listRestaurants } from "@/services/restaurants";

export const metadata: Metadata = { title: "Analitik" };

// Counts change constantly; a cached page would show stale numbers.
export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ restaurant?: string }> };

export default async function AnalyticsPage({ searchParams }: Props) {
  const { restaurant: restaurantFilter } = await searchParams;

  const [restaurants, overview] = await Promise.all([
    listRestaurants(),
    getAnalyticsOverview(restaurantFilter),
  ]);

  if (restaurants.length === 0) {
    return (
      <>
        <PageHeader title="Analitik" />
        <EmptyState
          title="Önce bir restoran oluşturun"
          description="Menünüz yayına girdikten sonra görüntülenme ve QR tarama sayıları burada görünür."
          action={
            <Button render={<Link href="/dashboard/restaurants/new" />} className="mt-2">
              Restoran oluştur
            </Button>
          }
        />
      </>
    );
  }

  const totalAll = overview.allTime.views + overview.allTime.qrScans;

  const stats = [
    { label: "Toplam görüntülenme", value: overview.allTime.views, icon: Eye },
    { label: "Toplam QR taraması", value: overview.allTime.qrScans, icon: QrCode },
    {
      label: "Son 7 gün",
      value: overview.last7.views + overview.last7.qrScans,
      icon: TrendingUp,
    },
  ];

  return (
    <>
      <PageHeader title="Analitik" description="Menünüz ne kadar görüntüleniyor?" />

      <Suspense fallback={<Skeleton className="h-10 w-64" />}>
        <RestaurantSwitcher restaurants={restaurants} />
      </Suspense>

      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-muted-foreground text-sm font-medium">{label}</CardTitle>
              <span className="bg-primary/10 text-primary flex size-8 items-center justify-center rounded-lg">
                <Icon className="size-4" aria-hidden />
              </span>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold tracking-tight tabular-nums">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Son 14 gün</CardTitle>
        </CardHeader>
        <CardContent>
          {totalAll === 0 ? (
            <p className="text-muted-foreground py-8 text-center text-sm text-pretty">
              Henüz veri yok. Menünüzü yayınlayıp karekodu paylaştığınızda ziyaretler burada görünmeye
              başlar. Kendi önizlemeleriniz sayılmaz.
            </p>
          ) : (
            <AnalyticsChart data={overview.daily} />
          )}
        </CardContent>
      </Card>

      {overview.byRestaurant.length > 0 ? (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Restoran</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead className="text-right">Görüntülenme</TableHead>
                <TableHead className="text-right">QR taraması</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {overview.byRestaurant.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    <p className="font-medium">{r.name}</p>
                    <p className="text-muted-foreground text-sm">/menu/{r.slug}</p>
                  </TableCell>
                  <TableCell>
                    <Badge variant={r.isPublished ? "default" : "secondary"}>
                      {r.isPublished ? "Yayında" : "Taslak"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{r.views}</TableCell>
                  <TableCell className="text-right tabular-nums">{r.qrScans}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : null}

      <p className="text-muted-foreground text-xs text-pretty">
        Sayımlar yaklaşıktır: yalnızca tarayıcıda açılan menüler sayılır, kendi önizlemeleriniz ve
        yayında olmayan menüler sayılmaz. &ldquo;QR taraması&rdquo;, karekod üzerinden gelen ziyaretleri
        gösterir.
      </p>
    </>
  );
}
