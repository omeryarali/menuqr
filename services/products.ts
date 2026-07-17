import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Category, Product } from "@/types/database";

export type ProductWithCategory = Product & { category: Pick<Category, "id" | "name"> | null };

export async function listProducts(options: { restaurantId?: string; categoryId?: string } = {}) {
  const supabase = await createClient();
  let query = supabase.from("products").select("*, category:categories(id, name)");

  if (options.restaurantId) query = query.eq("restaurant_id", options.restaurantId);
  if (options.categoryId) query = query.eq("category_id", options.categoryId);

  const { data, error } = await query
    .order("position", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) throw new Error(`Failed to load products: ${error.message}`);
  return (data ?? []) as unknown as ProductWithCategory[];
}

export async function getProduct(id: string): Promise<Product | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("products").select("*").eq("id", id).maybeSingle();

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
