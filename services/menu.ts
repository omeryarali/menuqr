import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { PublicMenu } from "@/types/database";

/**
 * Explicit collation locale for the name tiebreaker.
 *
 * localeCompare() with no locale uses the *server's* default, which is en-US on
 * Vercel — that sorts "izmir" before "ılık" and "öksüz" before "on", both wrong
 * in Turkish (I precedes İ, O precedes Ö). It silently looks correct on a
 * Turkish dev machine and only breaks in production, so pin it here.
 */
const COLLATION_LOCALE = "tr";

/**
 * Loads a published menu by slug for the public page.
 *
 * Visibility is entirely RLS's job:
 *   - anon / other users -> only published restaurants, active categories
 *   - the owner          -> also their own unpublished restaurant, which makes
 *                           /menu/{slug} double as a live preview
 *
 * Nested select pulls restaurant + categories + products in one round trip.
 * Rows the caller may not read are filtered out by the policies rather than
 * erroring, so an unpublished slug simply comes back null.
 */
export async function getPublicMenu(slug: string): Promise<PublicMenu | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("restaurants")
    .select(
      `
      *,
      categories (
        *,
        products (*)
      )
    `,
    )
    .eq("slug", slug)
    .maybeSingle();

  if (error) throw new Error(`Failed to load menu: ${error.message}`);
  if (!data) return null;

  const menu = data as unknown as PublicMenu;

  // PostgREST does not guarantee ordering inside embedded resources, so sort
  // here rather than trusting insertion order.
  const categories = [...(menu.categories ?? [])]
    .sort((a, b) => a.position - b.position || a.name.localeCompare(b.name, COLLATION_LOCALE))
    .map((category) => ({
      ...category,
      products: [...(category.products ?? [])].sort(
        (a, b) => a.position - b.position || a.name.localeCompare(b.name, COLLATION_LOCALE),
      ),
    }))
    // An empty category is noise on a customer-facing menu.
    .filter((category) => category.products.length > 0);

  return { ...menu, categories };
}

/** Slugs of published restaurants, for generateStaticParams / sitemap. */
export async function listPublishedSlugs(): Promise<string[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("restaurants").select("slug").eq("is_published", true);

  if (error) throw new Error(`Failed to list slugs: ${error.message}`);
  return (data ?? []).map((row) => row.slug);
}
