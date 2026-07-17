"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth";
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

  const { data, error } = await supabase
    .from("products")
    .update({
      category_id: input.categoryId,
      name: input.name,
      description: nullify(input.description),
      price: input.price,
      image_url: nullify(input.imageUrl),
      is_available: input.isAvailable,
      position: input.position,
    })
    .eq("id", id)
    .select("id");

  if (error) return errorState(error.message);
  if (!data?.length) return errorState("Ürün bulunamadı.");

  revalidatePath("/dashboard/products");
  revalidatePath("/menu", "layout");
  return { status: "success", message: "Ürün kaydedildi." };
}

export async function deleteProduct(id: string): Promise<ActionState> {
  await requireUser();
  const supabase = await createClient();

  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) return errorState(error.message);

  revalidatePath("/dashboard/products");
  revalidatePath("/menu", "layout");
  return { status: "success", message: "Ürün silindi." };
}
