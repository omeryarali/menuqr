import type { Metadata } from "next";

import { PageHeader } from "@/components/dashboard/page-header";
import { RestaurantForm } from "@/components/dashboard/restaurant-form";
import { Card, CardContent } from "@/components/ui/card";
import { createRestaurant } from "@/lib/actions/restaurants";

export const metadata: Metadata = { title: "Yeni restoran" };

export default function NewRestaurantPage() {
  return (
    <>
      <PageHeader title="Yeni restoran" description="Bunların hepsini sonradan değiştirebilirsiniz." />
      <Card className="max-w-3xl">
        <CardContent className="pt-6">
          <RestaurantForm action={createRestaurant} />
        </CardContent>
      </Card>
    </>
  );
}
