"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth";
import { removeProductImage } from "@/lib/storage-cleanup";
import { createClient } from "@/lib/supabase/server";
import { productSchema } from "@/lib/validators/product";

import { errorState, type ActionState } from "./types";

const nullify = (value?: string) => (value?.trim() ? value.trim() : null);

function parse(formData: FormData) {
  return productSchema.safeParse({
    categoryId: formData.get("categoryId"),
    name: formData.get("name"),
    description: formData.get("description") ?? "",
    price: formData.get("price"),
    imageUrl: formData.get("imageUrl") ?? "",
    isAvailable: formData.get("isAvailable") === "on",
    position: formData.get("position") ?? 0,
  });
}

export async function createProduct(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireUser();
  const parsed = parse(formData);

  if (!parsed.success) {
    return errorState("Aşağıdaki alanları kontrol edin.", parsed.error.flatten().fieldErrors);
  }

  const input = parsed.data;
  const supabase = await createClient();

  // restaurant_id is deliberately absent: the products_sync_restaurant trigger
  // derives it from category_id, and RLS then checks that derived value. So a
  // client cannot file a product under a category it doesn't own, and cannot
  // forge the tenant key either.
  const { error } = await supabase.from("products").insert({
    category_id: input.categoryId,
    name: input.name,
    description: nullify(input.description),
    price: input.price,
    image_url: nullify(input.imageUrl),
    is_available: input.isAvailable,
    position: input.position,
  });

  if (error) return errorState(error.message);

  revalidatePath("/dashboard/products");
  revalidatePath("/menu", "layout");
  return { status: "success", message: "Ürün oluşturuldu." };
}

export async function updateProduct(id: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireUser();
  const parsed = parse(formData);

  if (!parsed.success) {
    return errorState("Aşağıdaki alanları kontrol edin.", parsed.error.flatten().fieldErrors);
  }

  const input = parsed.data;
  const supabase = await createClient();
  const nextImage = nullify(input.imageUrl);

  // Read the old photo before overwriting the row — afterwards there is no
  // record of what to clean up. RLS scopes this select to our own product.
  const { data: existing } = await supabase.from("products").select("image_url").eq("id", id).maybeSingle();

  const { data, error } = await supabase
    .from("products")
    .update({
      category_id: input.categoryId,
      name: input.name,
      description: nullify(input.description),
      price: input.price,
      image_url: nextImage,
      is_available: input.isAvailable,
      position: input.position,
    })
    .eq("id", id)
    .select("id");

  if (error) return errorState(error.message);
  if (!data?.length) return errorState("Ürün bulunamadı.");

  // Only after the write succeeded, and only if the photo actually changed.
  if (existing?.image_url && existing.image_url !== nextImage) {
    await removeProductImage(supabase, existing.image_url);
  }

  revalidatePath("/dashboard/products");
  revalidatePath("/menu", "layout");
  return { status: "success", message: "Ürün kaydedildi." };
}

export async function deleteProduct(id: string): Promise<ActionState> {
  await requireUser();
  const supabase = await createClient();

  // Grab the photo path first: once the row is gone the URL is unrecoverable
  // and the file would sit in the bucket forever.
  const { data: existing } = await supabase.from("products").select("image_url").eq("id", id).maybeSingle();

  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) return errorState(error.message);

  await removeProductImage(supabase, existing?.image_url);

  revalidatePath("/dashboard/products");
  revalidatePath("/menu", "layout");
  return { status: "success", message: "Ürün silindi." };
}

/** Persists a drag-and-drop reorder. See reorderCategories for why this is safe. */
export async function reorderProducts(ids: string[]): Promise<ActionState> {
  await requireUser();
  if (ids.length === 0) return { status: "success" };

  const supabase = await createClient();
  const { error } = await supabase.rpc("reorder_products", { p_ids: ids });
  if (error) return errorState(error.message);

  revalidatePath("/dashboard/products");
  revalidatePath("/menu", "layout");
  return { status: "success", message: "Sıralama kaydedildi." };
}

/**
 * Flips a single product between available and sold out.
 *
 * Exists so a busy owner can mark something off mid-service without opening the
 * edit dialog — the one change they make most often during a shift.
 */
export async function toggleProductAvailability(id: string, isAvailable: boolean): Promise<ActionState> {
  await requireUser();

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .update({ is_available: isAvailable })
    .eq("id", id)
    .select("id");

  if (error) return errorState(error.message);
  if (!data?.length) return errorState("Ürün bulunamadı.");

  revalidatePath("/dashboard/products");
  revalidatePath("/menu", "layout");
  return { status: "success", message: isAvailable ? "Ürün mevcut olarak işaretlendi." : "Ürün tükendi olarak işaretlendi." };
}
