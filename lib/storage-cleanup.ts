import "server-only";

import { PRODUCT_IMAGE_BUCKET, storagePathFromUrl } from "@/lib/storage";
import type { createClient } from "@/lib/supabase/server";

type Supabase = Awaited<ReturnType<typeof createClient>>;

/**
 * Storage cleanup for deleted products.
 *
 * All of it is best effort: the database change is what the user asked for, and
 * an orphaned file is a storage cost, not a correctness bug. Cleanup must never
 * turn a successful delete into a visible failure.
 *
 * Deleting a category or a restaurant cascades to products in Postgres, but the
 * bucket knows nothing about that cascade — without these helpers every photo
 * under them would stay forever.
 */

/**
 * Deletes objects and reports the case that has no error attached.
 *
 * Storage answers a delete it could not see with `{ data: [], error: null }` —
 * exactly what an RLS policy that hides the row produces. Treating that as
 * success is how orphaned files accumulate invisibly (see migration 0007), so
 * an empty result for a non-empty request is logged as the failure it is.
 */
async function removePaths(supabase: Supabase, paths: string[], context: string) {
  if (paths.length === 0) return;

  const { data, error } = await supabase.storage.from(PRODUCT_IMAGE_BUCKET).remove(paths);

  if (error) {
    console.error(`Failed to remove ${context}: ${error.message}`);
    return;
  }
  if (!data?.length) {
    console.error(
      `Storage reported no deletions for ${context} (${paths.length} requested) — ` +
        "the objects are probably hidden by RLS; check the storage policies.",
    );
  }
}

/** Removes one photo, but only when it is a file we uploaded. */
export async function removeProductImage(supabase: Supabase, url: string | null | undefined) {
  // Returns null for pasted third-party URLs, so we can only delete our own.
  const path = storagePathFromUrl(url);
  if (!path) return;

  await removePaths(supabase, [path], `product image ${path}`);
}

/** Removes the photos of every product in a category (call before deleting it). */
export async function removeImagesForCategory(supabase: Supabase, categoryId: string) {
  const { data } = await supabase.from("products").select("image_url").eq("category_id", categoryId);
  const paths = (data ?? [])
    .map((row) => storagePathFromUrl(row.image_url))
    .filter((path): path is string => Boolean(path));

  await removePaths(supabase, paths, `images for category ${categoryId}`);
}

/**
 * Empties a restaurant's whole folder (call before deleting the restaurant).
 *
 * Lists the bucket rather than reading image_url values: the folder is the
 * tenant boundary, so this also sweeps up files whose product row already went
 * away — orphans a URL-based pass would miss.
 */
export async function removeImagesForRestaurant(supabase: Supabase, restaurantId: string) {
  const { data, error: listError } = await supabase.storage
    .from(PRODUCT_IMAGE_BUCKET)
    .list(restaurantId, { limit: 1000 });

  if (listError) {
    console.error(`Failed to list images for restaurant ${restaurantId}: ${listError.message}`);
    return;
  }
  if (!data?.length) return;

  await removePaths(
    supabase,
    data.map((file) => `${restaurantId}/${file.name}`),
    `images for restaurant ${restaurantId}`,
  );
}
