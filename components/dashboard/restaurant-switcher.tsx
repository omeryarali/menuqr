"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Restaurant } from "@/types/database";

/**
 * Scopes the categories/products lists to one restaurant via ?restaurant=<id>.
 *
 * The selection lives in the URL rather than in state so it survives reloads
 * and stays shareable, and so the page can keep rendering on the server.
 */
export function RestaurantSwitcher({ restaurants }: { restaurants: Restaurant[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const current = searchParams.get("restaurant") ?? "all";

  function handleChange(value: string | null) {
    const params = new URLSearchParams(searchParams);
    if (!value || value === "all") {
      params.delete("restaurant");
    } else {
      params.set("restaurant", value);
    }
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  }

  return (
    <Select value={current} onValueChange={handleChange}>
      <SelectTrigger className="w-full sm:w-64">
        <SelectValue placeholder="Tüm restoranlar" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">Tüm restoranlar</SelectItem>
        {restaurants.map((restaurant) => (
          <SelectItem key={restaurant.id} value={restaurant.id}>
            {restaurant.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
