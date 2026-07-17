import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Category } from "@/types/database";

export async function listCategories(restaurantId?: string): Promise<Category[]> {
  const supabase = await createClient();
  let query = supabase.from("categories").select("*");
  if (restaurantId) query = query.eq("restaurant_id", restaurantId);

  const { data, error } = await query
    .order("position", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) throw new Error(`Failed to load categories: ${error.message}`);
  return data ?? [];
}

export async function getCategory(id: string): Promise<Category | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("categories").select("*").eq("id", id).maybeSingle();

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
