"use client";

import { useActionState, useEffect, useRef, useState } from "react";

import { toast } from "sonner";

import { FieldError } from "@/components/shared/field-error";
import { SubmitButton } from "@/components/shared/submit-button";
import { ThemePicker } from "@/components/dashboard/theme-picker";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { idleState, type ActionState } from "@/lib/actions/types";
import { slugify } from "@/lib/utils/slug";
import type { Restaurant } from "@/types/database";

type Props = {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  restaurant?: Restaurant;
};

export function RestaurantForm({ action, restaurant }: Props) {
  const [state, formAction] = useActionState(action, idleState);
  const [slug, setSlug] = useState(restaurant?.slug ?? "");

  // Stop auto-filling the slug from the name once the user edits it by hand,
  // or once we're editing a saved restaurant (whose URL is already public).
  const slugTouched = useRef(Boolean(restaurant));

  const fieldErrors = state.status === "error" ? state.fieldErrors : undefined;

  useEffect(() => {
    if (state.status === "success" && state.message) toast.success(state.message);
  }, [state]);

  return (
    <form action={formAction} className="space-y-6" noValidate>
      {state.status === "error" && !fieldErrors ? (
        <Alert variant="destructive">
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">İsim</Label>
          <Input
            id="name"
            name="name"
            defaultValue={restaurant?.name}
            onChange={(event) => {
              if (!slugTouched.current) setSlug(slugify(event.target.value));
            }}
            required
          />
          <FieldError messages={fieldErrors?.name} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="slug">Menü adresi</Label>
          <div className="flex items-center gap-1">
            <span className="text-muted-foreground shrink-0 text-sm">/menu/</span>
            <Input
              id="slug"
              name="slug"
              value={slug}
              onChange={(event) => {
                slugTouched.current = true;
                setSlug(event.target.value);
              }}
              onBlur={(event) => setSlug(slugify(event.target.value))}
              required
            />
          </div>
          <FieldError messages={fieldErrors?.slug} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Açıklama</Label>
        <Textarea id="description" name="description" rows={3} defaultValue={restaurant?.description ?? ""} />
        <FieldError messages={fieldErrors?.description} />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="address">Adres</Label>
          <Input id="address" name="address" defaultValue={restaurant?.address ?? ""} />
          <FieldError messages={fieldErrors?.address} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="currency">Para birimi</Label>
          <Input
            id="currency"
            name="currency"
            maxLength={3}
            className="uppercase"
            defaultValue={restaurant?.currency ?? "TRY"}
            required
          />
          <FieldError messages={fieldErrors?.currency} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Telefon</Label>
        <Input id="phone" name="phone" type="tel" defaultValue={restaurant?.phone ?? ""} />
        <FieldError messages={fieldErrors?.phone} />
      </div>

      <ThemePicker value={restaurant?.theme} />

      <div className="flex items-center justify-between rounded-lg border p-4">
        <div className="space-y-0.5 pr-4">
          <Label htmlFor="isPublished">Yayında</Label>
          <p className="text-muted-foreground text-sm">
            Kapalıyken menü adresi sizin dışınızdaki herkese 404 döner.
          </p>
        </div>
        <Switch id="isPublished" name="isPublished" defaultChecked={restaurant?.is_published ?? false} />
      </div>

      <SubmitButton>{restaurant ? "Değişiklikleri kaydet" : "Restoranı oluştur"}</SubmitButton>
    </form>
  );
}
