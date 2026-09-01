"use client";

import { useActionState, useEffect, useRef, useState } from "react";

import { toast } from "sonner";

import { FieldError } from "@/components/shared/field-error";
import { SubmitButton } from "@/components/shared/submit-button";
import { AddressField } from "@/components/dashboard/address-field";
import { OpeningHoursField } from "@/components/dashboard/opening-hours-field";
import { PhoneField } from "@/components/dashboard/phone-field";
import { ThemePicker } from "@/components/dashboard/theme-picker";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { idleState, type ActionState } from "@/lib/actions/types";
import {
  CURRENCY_CODES,
  CURRENCY_LABELS,
  DEFAULT_CURRENCY,
  normalizeCurrency,
  type CurrencyCode,
} from "@/lib/currencies";
import { parseOpeningHours } from "@/lib/opening-hours";
import { slugify } from "@/lib/utils/slug";
import type { Restaurant } from "@/types/database";

type Props = {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  restaurant?: Restaurant;
};

export function RestaurantForm({ action, restaurant }: Props) {
  const [state, formAction] = useActionState(action, idleState);
  const [slug, setSlug] = useState(restaurant?.slug ?? "");
  // A code from before the picker existed that is not on the list falls back to
  // TRY rather than leaving the trigger blank. Migration 0014 rewrites those
  // rows, so this only covers a row saved between deploy and migration.
  const [currency, setCurrency] = useState<CurrencyCode>(
    normalizeCurrency(restaurant?.currency) ?? DEFAULT_CURRENCY,
  );

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

      <div className="space-y-2">
        <AddressField
          defaultAddress={restaurant?.address ?? ""}
          defaultLatitude={restaurant?.latitude ?? null}
          defaultLongitude={restaurant?.longitude ?? null}
        />
        <FieldError messages={fieldErrors?.address} />
        <FieldError messages={fieldErrors?.latitude} />
      </div>

      <div className="space-y-2 sm:max-w-xs">
          <Label htmlFor="currency">Para birimi</Label>
          <Select
            name="currency"
            value={currency}
            onValueChange={(next) => next && setCurrency(next as CurrencyCode)}
            items={CURRENCY_LABELS}
            required
          >
            <SelectTrigger id="currency" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CURRENCY_CODES.map((code) => (
                <SelectItem key={code} value={code}>
                  {CURRENCY_LABELS[code]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldError messages={fieldErrors?.currency} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Telefon</Label>
        <PhoneField defaultValue={restaurant?.phone} />
        <FieldError messages={fieldErrors?.phone} />
      </div>

      <OpeningHoursField value={parseOpeningHours(restaurant?.opening_hours)} />

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
