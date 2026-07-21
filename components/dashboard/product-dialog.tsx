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
import { createProduct, updateProduct } from "@/lib/actions/products";
import { idleState, type ActionState } from "@/lib/actions/types";
import type { Category, Product } from "@/types/database";

type Props = {
  categories: Category[];
  product?: Product;
  defaultCategoryId?: string;
  nextPosition?: number;
};

export function ProductDialog({ categories, product, defaultCategoryId, nextPosition = 0 }: Props) {
  const isEdit = Boolean(product);
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<ActionState>(idleState);
  const [formKey, setFormKey] = useState(0);

  const fieldErrors = state.status === "error" ? state.fieldErrors : undefined;

  // See CategoryDialog: awaiting the action here (instead of useActionState +
  // an effect) is what lets a successful save close the dialog without
  // triggering a cascading render.
  async function handleSubmit(formData: FormData) {
    const action = isEdit ? updateProduct.bind(null, product!.id) : createProduct;
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {isEdit ? (
        <DialogTrigger render={<Button variant="ghost" size="icon" />}>
          <Pencil className="size-4" aria-hidden />
          <span className="sr-only">{product!.name} ürününü düzenle</span>
        </DialogTrigger>
      ) : (
        <DialogTrigger render={<Button disabled={categories.length === 0} />}>
          <Plus className="size-4" aria-hidden />
          Yeni ürün
        </DialogTrigger>
      )}

      <DialogContent className="max-h-[90svh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Ürünü düzenle" : "Yeni ürün"}</DialogTitle>
          <DialogDescription>
            Bir ürün başka bir restoranın kategorisine taşınamaz.
          </DialogDescription>
        </DialogHeader>

        <form key={formKey} action={handleSubmit} className="space-y-4" noValidate>
          {state.status === "error" && !fieldErrors ? (
            <Alert variant="destructive">
              <AlertDescription>{state.message}</AlertDescription>
            </Alert>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="categoryId">Kategori</Label>
            {/* items = value→label map so the trigger shows the category name,
                not its UUID (Base UI SelectValue doesn't auto-resolve labels). */}
            <Select
              name="categoryId"
              defaultValue={product?.category_id ?? defaultCategoryId ?? categories[0]?.id}
              items={Object.fromEntries(categories.map((c) => [c.id, c.name]))}
              required
            >
              <SelectTrigger id="categoryId">
                <SelectValue placeholder="Bir kategori seçin" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldError messages={fieldErrors?.categoryId} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="product-name">İsim</Label>
            <Input id="product-name" name="name" defaultValue={product?.name} required />
            <FieldError messages={fieldErrors?.name} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="product-description">Açıklama</Label>
            <Textarea
              id="product-description"
              name="description"
              rows={2}
              defaultValue={product?.description ?? ""}
            />
            <FieldError messages={fieldErrors?.description} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="price">Fiyat</Label>
              <Input
                id="price"
                name="price"
                type="number"
                step="0.01"
                min="0"
                inputMode="decimal"
                defaultValue={product?.price ?? 0}
                required
              />
              <FieldError messages={fieldErrors?.price} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="product-position">Sıra</Label>
              <Input
                id="product-position"
                name="position"
                type="number"
                min={0}
                defaultValue={product?.position ?? nextPosition}
              />
              <FieldError messages={fieldErrors?.position} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="imageUrl">Görsel adresi</Label>
            <Input
              id="imageUrl"
              name="imageUrl"
              type="url"
              placeholder="https://…"
              defaultValue={product?.image_url ?? ""}
            />
            <FieldError messages={fieldErrors?.imageUrl} />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="space-y-0.5">
              <Label htmlFor="isAvailable">Mevcut</Label>
              <p className="text-muted-foreground text-xs">Mevcut olmayan ürünler tükendi olarak görünür.</p>
            </div>
            <Switch id="isAvailable" name="isAvailable" defaultChecked={product?.is_available ?? true} />
          </div>

          <SubmitButton className="w-full">{isEdit ? "Değişiklikleri kaydet" : "Ürünü oluştur"}</SubmitButton>
        </form>
      </DialogContent>
    </Dialog>
  );
}
