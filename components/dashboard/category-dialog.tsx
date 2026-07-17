"use client";

import { useState } from "react";

import { Pencil, Plus } from "lucide-react";
import { toast } from "sonner";

import { FieldError } from "@/components/shared/field-error";
import { SubmitButton } from "@/components/shared/submit-button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { createCategory, updateCategory } from "@/lib/actions/categories";
import { idleState, type ActionState } from "@/lib/actions/types";
import type { Category, Restaurant } from "@/types/database";

type Props = {
  restaurants: Restaurant[];
  category?: Category;
  /** Preselected restaurant for the create case, from the ?restaurant= filter. */
  defaultRestaurantId?: string;
  nextPosition?: number;
};

export function CategoryDialog({ restaurants, category, defaultRestaurantId, nextPosition = 0 }: Props) {
  const isEdit = Boolean(category);
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<ActionState>(idleState);

  // Bumped on success to remount the form, clearing what the user typed. Reused
  // as the form's key.
  const [formKey, setFormKey] = useState(0);

  const fieldErrors = state.status === "error" ? state.fieldErrors : undefined;

  /**
   * Awaited directly rather than run through useActionState, so success can
   * close the dialog right here. Doing that in an effect keyed on the action
   * state means setting state during render-after-commit, which cascades.
   * Passing an async function to <form action> still drives useFormStatus, so
   * SubmitButton keeps its pending spinner.
   */
  async function handleSubmit(formData: FormData) {
    const action = isEdit ? updateCategory.bind(null, category!.id) : createCategory;
    const result = await action(idleState, formData);

    if (result.status === "error") {
      setState(result);
      return;
    }

    toast.success(result.status === "success" && result.message ? result.message : "Kaydedildi.");
    setState(idleState);
    setFormKey((key) => key + 1);
    setOpen(false);
  }

  const restaurantId = category?.restaurant_id ?? defaultRestaurantId ?? restaurants[0]?.id;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {isEdit ? (
        <DialogTrigger render={<Button variant="ghost" size="icon" />}>
          <Pencil className="size-4" aria-hidden />
          <span className="sr-only">{category!.name} kategorisini düzenle</span>
        </DialogTrigger>
      ) : (
        <DialogTrigger render={<Button disabled={restaurants.length === 0} />}>
          <Plus className="size-4" aria-hidden />
          Yeni kategori
        </DialogTrigger>
      )}

      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Kategoriyi düzenle" : "Yeni kategori"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Kategoriler restoranlar arasında taşınamaz."
              : "Kategoriler, genel menünüzde ürünleri gruplar."}
          </DialogDescription>
        </DialogHeader>

        <form key={formKey} action={handleSubmit} className="space-y-4" noValidate>
          {state.status === "error" && !fieldErrors ? (
            <Alert variant="destructive">
              <AlertDescription>{state.message}</AlertDescription>
            </Alert>
          ) : null}

          {isEdit ? (
            <input type="hidden" name="restaurantId" value={restaurantId} />
          ) : (
            <div className="space-y-2">
              <Label htmlFor="restaurantId">Restoran</Label>
              <Select name="restaurantId" defaultValue={restaurantId} required>
                <SelectTrigger id="restaurantId">
                  <SelectValue placeholder="Bir restoran seçin" />
                </SelectTrigger>
                <SelectContent>
                  {restaurants.map((restaurant) => (
                    <SelectItem key={restaurant.id} value={restaurant.id}>
                      {restaurant.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError messages={fieldErrors?.restaurantId} />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="category-name">İsim</Label>
            <Input id="category-name" name="name" defaultValue={category?.name} required />
            <FieldError messages={fieldErrors?.name} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category-description">Açıklama</Label>
            <Textarea
              id="category-description"
              name="description"
              rows={2}
              defaultValue={category?.description ?? ""}
            />
            <FieldError messages={fieldErrors?.description} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category-position">Sıra</Label>
            <Input
              id="category-position"
              name="position"
              type="number"
              min={0}
              defaultValue={category?.position ?? nextPosition}
            />
            <p className="text-muted-foreground text-xs">Küçük sayılar menüde önce görünür.</p>
            <FieldError messages={fieldErrors?.position} />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <Label htmlFor="category-active">Menüde göster</Label>
            <Switch id="category-active" name="isActive" defaultChecked={category?.is_active ?? true} />
          </div>

          <SubmitButton className="w-full">{isEdit ? "Değişiklikleri kaydet" : "Kategoriyi oluştur"}</SubmitButton>
        </form>
      </DialogContent>
    </Dialog>
  );
}
