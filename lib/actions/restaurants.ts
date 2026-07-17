"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { restaurantSchema } from "@/lib/validators/restaurant";

import { errorState, type ActionState } from "./types";

/** Postgres unique_violation. Surfaces as a slug collision here. */
const UNIQUE_VIOLATION = "23505";

function parse(formData: FormData) {
  return restaurantSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    description: formData.get("description") ?? "",
    address: formData.get("address") ?? "",
    phone: formData.get("phone") ?? "",
    currency: formData.get("currency"),
    isPublished: formData.get("isPublished") === "on",
    theme: formData.get("theme") ?? "classic",
  });
}

/** "" from an empty input should be NULL in the DB, not an empty string. */
const nullify = (value?: string) => (value?.trim() ? value.trim() : null);

export async function createRestaurant(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const parsed = parse(formData);

  if (!parsed.success) {
    return errorState("Aşağıdaki alanları kontrol edin.", parsed.error.flatten().fieldErrors);
  }

  const input = parsed.data;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("restaurants")
    .insert({
      owner_id: user.id,
      name: input.name,
      slug: input.slug,
      description: nullify(input.description),
      address: nullify(input.address),
      phone: nullify(input.phone),
      currency: input.currency,
      is_published: input.isPublished,
      theme: input.theme,
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === UNIQUE_VIOLATION) {
      return errorState("Bu menü adresi kullanılıyor.", { slug: ["Bu adres zaten kullanımda"] });
    }
    return errorState(error.message);
  }

  revalidatePath("/dashboard/restaurants");
  redirect(`/dashboard/restaurants/${data.id}`);
}

export async function updateRestaurant(
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

  // No owner check: RLS makes this update a no-op for rows we don't own.
  const { data, error } = await supabase
    .from("restaurants")
    .update({
      name: input.name,
      slug: input.slug,
      description: nullify(input.description),
      address: nullify(input.address),
      phone: nullify(input.phone),
      currency: input.currency,
      is_published: input.isPublished,
      theme: input.theme,
    })
    .eq("id", id)
    .select("id");

  if (error) {
    if (error.code === UNIQUE_VIOLATION) {
      return errorState("Bu menü adresi kullanılıyor.", { slug: ["Bu adres zaten kullanımda"] });
    }
    return errorState(error.message);
  }

  // Zero rows means RLS filtered it out, not that the write failed loudly.
  if (!data?.length) {
    return errorState("Restoran bulunamadı.");
  }

  revalidatePath("/dashboard/restaurants");
  revalidatePath(`/dashboard/restaurants/${id}`);
  revalidatePath("/menu", "layout");

  return { status: "success", message: "Restoran kaydedildi." };
}

export async function deleteRestaurant(id: string): Promise<void> {
  await requireUser();
  const supabase = await createClient();

  // Categories, products and QR codes cascade via FK ON DELETE CASCADE.
  const { error } = await supabase.from("restaurants").delete().eq("id", id);
  if (error) throw new Error(`Failed to delete restaurant: ${error.message}`);

  revalidatePath("/dashboard/restaurants");
  redirect("/dashboard/restaurants");
}
