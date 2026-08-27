import { env } from "@/lib/env";

/** Matches the bucket created in supabase/migrations/0006_product_images.sql. */
export const PRODUCT_IMAGE_BUCKET = "product-images";

/** Mirrors the bucket's allowed_mime_types. Storage rejects anything else. */
export const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];

/** Mirrors the bucket's file_size_limit (5 MB). */
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

const PUBLIC_PREFIX = `/storage/v1/object/public/${PRODUCT_IMAGE_BUCKET}/`;

/** Host of the Supabase project, used to tell our own uploads from pasted URLs. */
export function supabaseHost(): string | null {
  try {
    return new URL(env.NEXT_PUBLIC_SUPABASE_URL).host;
  } catch {
    return null;
  }
}

/**
 * True when a URL points at our own bucket.
 *
 * Product images come from two places: files uploaded here, and URLs the owner
 * pasted from anywhere on the web. Only the former can go through next/image —
 * the optimizer refuses hosts that aren't in next.config's allowlist — so the
 * menu asks this before choosing how to render.
 */
export function isUploadedImage(url: string): boolean {
  const host = supabaseHost();
  if (!host) return false;
  try {
    const parsed = new URL(url);
    return parsed.host === host && parsed.pathname.startsWith(PUBLIC_PREFIX);
  } catch {
    return false;
  }
}

/**
 * Public URL -> object path inside the bucket, or null when the URL isn't ours.
 *
 * Returning null for foreign URLs is what stops cleanup from trying to delete
 * something we never uploaded.
 */
export function storagePathFromUrl(url: string | null | undefined): string | null {
  if (!url || !isUploadedImage(url)) return null;
  try {
    const path = new URL(url).pathname.slice(PUBLIC_PREFIX.length);
    return decodeURIComponent(path) || null;
  } catch {
    return null;
  }
}

const EXTENSION_BY_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};

/**
 * `{restaurant_id}/{uuid}.{ext}` — the layout migration 0006's policies expect.
 *
 * The extension comes from the MIME type, never the filename: Storage validates
 * the type against the bucket's allowlist, while the name is attacker-supplied.
 * The name is discarded entirely anyway (a uuid replaces it), which is also what
 * makes path traversal impossible here.
 */
export function buildImagePath(restaurantId: string, file: File): string {
  const ext = EXTENSION_BY_TYPE[file.type] ?? "jpg";
  return `${restaurantId}/${crypto.randomUUID()}.${ext}`;
}
