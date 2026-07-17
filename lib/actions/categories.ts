"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth";
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

  // Products cascade. The confirm dialog warns about this.
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) return errorState(error.message);

  revalidatePath("/dashboard/categories");
  revalidatePath("/dashboard/products");
  revalidatePath("/menu", "layout");
  return { status: "success", message: "Kategori silindi." };
}
