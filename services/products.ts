import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Category, Product } from "@/types/database";

import { listOwnedRestaurantIds } from "./restaurants";

export type ProductWithCategory = Product & { category: Pick<Category, "id" | "name"> | null };

/**
 * Owner-facing product reads. Scoped by restaurant ownership rather than RLS
 * alone — products carry a public-read policy for `authenticated`, so an
 * unscoped select leaks other owners' published products into the dashboard.
 * See services/restaurants.ts for the full rationale.
 */
export async function listProducts(options: { restaurantId?: string; categoryId?: string } = {}) {
  const supabase = await createClient();
  const ownedIds = await listOwnedRestaurantIds();

  const scope = options.restaurantId
    ? ownedIds.includes(options.restaurantId)
      ? [options.restaurantId]
      : []
    : ownedIds;
  if (scope.length === 0) return [] as ProductWithCategory[];

  let query = supabase.from("products").select("*, category:categories(id, name)").in("restaurant_id", scope);
  if (options.categoryId) query = query.eq("category_id", options.categoryId);

  const { data, error } = await query
    .order("position", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) throw new Error(`Failed to load products: ${error.message}`);
  return (data ?? []) as unknown as ProductWithCategory[];
}

export async function getProduct(id: string): Promise<Product | null> {
  const supabase = await createClient();
  const ownedIds = await listOwnedRestaurantIds();
  if (ownedIds.length === 0) return null;

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .in("restaurant_id", ownedIds)
    .maybeSingle();

  if (error) throw new Error(`Failed to load product: ${error.message}`);
  return data;
}

export async function nextProductPosition(categoryId: string): Promise<number> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select("position")
    .eq("category_id", categoryId)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(`Failed to compute position: ${error.message}`);
  return (data?.position ?? -1) + 1;
}
