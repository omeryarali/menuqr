import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Category } from "@/types/database";

import { listOwnedRestaurantIds } from "./restaurants";

/**
 * Owner-facing category reads. Scoped by restaurant ownership rather than RLS
 * alone: categories have a public-read policy granted to `authenticated`, so an
 * unscoped select would also return other owners' *published* categories. See
 * services/restaurants.ts for the full rationale.
 */
export async function listCategories(restaurantId?: string): Promise<Category[]> {
  const supabase = await createClient();
  const ownedIds = await listOwnedRestaurantIds();

  // Intersect the requested restaurant (if any) with what the caller owns, so a
  // hand-crafted ?restaurant=<someone-else's-id> can't widen the result.
  const scope = restaurantId ? (ownedIds.includes(restaurantId) ? [restaurantId] : []) : ownedIds;
  if (scope.length === 0) return [];

  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .in("restaurant_id", scope)
    .order("position", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) throw new Error(`Failed to load categories: ${error.message}`);
  return data ?? [];
}

export async function getCategory(id: string): Promise<Category | null> {
  const supabase = await createClient();
  const ownedIds = await listOwnedRestaurantIds();
  if (ownedIds.length === 0) return null;

  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("id", id)
    .in("restaurant_id", ownedIds)
    .maybeSingle();

  if (error) throw new Error(`Failed to load category: ${error.message}`);
  return data;
}

/** Next free position, so new categories append instead of colliding at 0. */
export async function nextCategoryPosition(restaurantId: string): Promise<number> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("position")
    .eq("restaurant_id", restaurantId)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(`Failed to compute position: ${error.message}`);
  return (data?.position ?? -1) + 1;
}
