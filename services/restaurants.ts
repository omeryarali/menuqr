import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Restaurant } from "@/types/database";

/**
 * Owner-facing data access for restaurants.
 *
 * These MUST filter by owner_id explicitly. It is tempting to lean on RLS
 * alone, but `restaurants` has a public-read policy granted to `authenticated`
 * as well as `anon` (so a signed-in user can view anyone's published menu).
 * That means an unscoped `select("*")` returns the caller's own rows PLUS every
 * other owner's *published* restaurant — which is correct for the public menu,
 * but wrong for a dashboard that must show only "my restaurants". RLS is the
 * security boundary (it still blocks writes and hides drafts); the owner filter
 * here is what makes these reads mean "mine".
 */

async function currentUserId(supabase: Awaited<ReturnType<typeof createClient>>): Promise<string | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

export async function listRestaurants(): Promise<Restaurant[]> {
  const supabase = await createClient();
  const uid = await currentUserId(supabase);
  if (!uid) return [];

  const { data, error } = await supabase
    .from("restaurants")
    .select("*")
    .eq("owner_id", uid)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Failed to load restaurants: ${error.message}`);
  return data ?? [];
}

/**
 * IDs of the restaurants the caller owns. The scoping key for categories and
 * products, which carry restaurant_id but no owner_id of their own.
 */
export async function listOwnedRestaurantIds(): Promise<string[]> {
  const supabase = await createClient();
  const uid = await currentUserId(supabase);
  if (!uid) return [];

  const { data, error } = await supabase.from("restaurants").select("id").eq("owner_id", uid);
  if (error) throw new Error(`Failed to load restaurant ids: ${error.message}`);
  return (data ?? []).map((row) => row.id);
}

export async function getRestaurant(id: string): Promise<Restaurant | null> {
  const supabase = await createClient();
  const uid = await currentUserId(supabase);
  if (!uid) return null;

  // owner_id filter, not just id: without it the dashboard detail/edit page
  // would open for any *published* restaurant (RLS permits the read), showing
  // another owner's edit form even though the save would be rejected.
  const { data, error } = await supabase
    .from("restaurants")
    .select("*")
    .eq("id", id)
    .eq("owner_id", uid)
    .maybeSingle();

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
