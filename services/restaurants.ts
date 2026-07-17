import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Restaurant } from "@/types/database";

/**
 * Data access for restaurants.
 *
 * None of these functions filter by owner. They don't need to: RLS scopes
 * every query to the caller's own rows, so a bad id returns empty rather than
 * someone else's data. Keep it that way — a WHERE owner_id clause here would
 * imply the isolation lives in application code, and it does not.
 */

export async function listRestaurants(): Promise<Restaurant[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("restaurants")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Failed to load restaurants: ${error.message}`);
  return data ?? [];
}

export async function getRestaurant(id: string): Promise<Restaurant | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("restaurants").select("*").eq("id", id).maybeSingle();

  if (error) throw new Error(`Failed to load restaurant: ${error.message}`);
  return data;
}

/** True if the slug is free. Used for inline feedback before submit. */
export async function isSlugAvailable(slug: string, excludeId?: string): Promise<boolean> {
  const supabase = await createClient();
  let query = supabase.from("restaurants").select("id").eq("slug", slug);
  if (excludeId) query = query.neq("id", excludeId);

  const { data, error } = await query.maybeSingle();
  if (error) throw new Error(`Failed to check slug: ${error.message}`);

  // RLS hides other owners' restaurants, so a "free" answer here is advisory
  // only — the UNIQUE constraint is what actually decides. Callers must still
  // handle a 23505 on write.
  return data === null;
}

export async function countRestaurantChildren(restaurantId: string) {
  const supabase = await createClient();

  const [categories, products] = await Promise.all([
    supabase.from("categories").select("id", { count: "exact", head: true }).eq("restaurant_id", restaurantId),
    supabase.from("products").select("id", { count: "exact", head: true }).eq("restaurant_id", restaurantId),
  ]);

  if (categories.error) throw new Error(`Failed to count categories: ${categories.error.message}`);
  if (products.error) throw new Error(`Failed to count products: ${products.error.message}`);

  return { categories: categories.count ?? 0, products: products.count ?? 0 };
}
