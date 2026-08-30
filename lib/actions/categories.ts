"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth";
import { buildTranslations } from "@/lib/i18n-form";
import { removeImagesForCategory } from "@/lib/storage-cleanup";
import { createClient } from "@/lib/supabase/server";
import { categorySchema } from "@/lib/validators/category";

import { errorState, type ActionState } from "./types";

const nullify = (value?: string) => (value?.trim() ? value.trim() : null);

function parse(formData: FormData) {
  return categorySchema.safeParse({
    restaurantId: formData.get("restaurantId"),
    name: formData.get("name"),
    description: formData.get("description") ?? "",
    position: formData.get("position") ?? 0,
    isActive: formData.get("isActive") === "on",
    nameEn: formData.get("nameEn") ?? "",
    descriptionEn: formData.get("descriptionEn") ?? "",
  });
}

export async function createCategory(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireUser();
  const parsed = parse(formData);

  if (!parsed.success) {
    return errorState("Aşağıdaki alanları kontrol edin.", parsed.error.flatten().fieldErrors);
  }

  const input = parsed.data;
  const supabase = await createClient();

  // If restaurantId isn't ours, the RLS WITH CHECK rejects the insert. No
  // pre-flight ownership query needed.
  const { error } = await supabase.from("categories").insert({
    restaurant_id: input.restaurantId,
    name: input.name,
    description: nullify(input.description),
    position: input.position,
    is_active: input.isActive,
    translations: buildTranslations(input.nameEn, input.descriptionEn),
  });

  if (error) return errorState(error.message);

  revalidatePath("/dashboard/categories");
  revalidatePath("/menu", "layout");
  return { status: "success", message: "Kategori oluşturuldu." };
}

export async function updateCategory(
  id: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireUser();
  const parsed = parse(formData);

  if (!parsed.success) {
    return errorState("Aşağıdaki alanları kontrol edin.", parsed.error.flatten().fieldErrors);
  }

  const input = parsed.data;
  const supabase = await createClient();

  // restaurant_id is intentionally not updatable: moving a category between
  // restaurants would strand its products under the old tenant.
  const { data, error } = await supabase
    .from("categories")
    .update({
      name: input.name,
      description: nullify(input.description),
      position: input.position,
      is_active: input.isActive,
      translations: buildTranslations(input.nameEn, input.descriptionEn),
    })
    .eq("id", id)
    .select("id");

  if (error) return errorState(error.message);
  if (!data?.length) return errorState("Kategori bulunamadı.");

  revalidatePath("/dashboard/categories");
  revalidatePath("/menu", "layout");
  return { status: "success", message: "Kategori kaydedildi." };
}

export async function deleteCategory(id: string): Promise<ActionState> {
  await requireUser();
  const supabase = await createClient();

  // Products cascade in Postgres, but the storage bucket doesn't know about
  // that — sweep their photos first, while the rows still name them.
  await removeImagesForCategory(supabase, id);

  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) return errorState(error.message);

  revalidatePath("/dashboard/categories");
  revalidatePath("/dashboard/products");
  revalidatePath("/menu", "layout");
  return { status: "success", message: "Kategori silindi." };
}

/**
 * Persists a drag-and-drop reorder.
 *
 * The RPC rewrites every position in one statement, and RLS inside it means an
 * id we don't own simply matches nothing — no ownership pre-check needed here.
 */
export async function reorderCategories(ids: string[]): Promise<ActionState> {
  await requireUser();
  if (ids.length === 0) return { status: "success" };

  const supabase = await createClient();
  const { error } = await supabase.rpc("reorder_categories", { p_ids: ids });
  if (error) return errorState(error.message);

  revalidatePath("/dashboard/categories");
  revalidatePath("/menu", "layout");
  return { status: "success", message: "Sıralama kaydedildi." };
}
