"use client";

import { useState, useTransition } from "react";

import { toast } from "sonner";

import { Switch } from "@/components/ui/switch";
import { toggleProductAvailability } from "@/lib/actions/products";

/**
 * One-tap "sold out" switch for a product row.
 *
 * Flips locally first and reverts if the server rejects it: mid-service the
 * owner needs to see the change land instantly, and waiting for a round trip
 * before the switch moves reads as a broken control.
 */
export function AvailabilityToggle({
  productId,
  productName,
  isAvailable,
}: {
  productId: string;
  productName: string;
  isAvailable: boolean;
}) {
  const [checked, setChecked] = useState(isAvailable);
  const [pending, startTransition] = useTransition();

  // Re-sync when the server sends a different value (edited in the dialog,
  // changed in another tab). Render-phase adjustment, not an effect.
  const [seen, setSeen] = useState(isAvailable);
  if (isAvailable !== seen) {
    setSeen(isAvailable);
    setChecked(isAvailable);
  }

  function handleChange(next: boolean) {
    const previous = checked;
    setChecked(next);

    startTransition(async () => {
      const result = await toggleProductAvailability(productId, next);
      if (result.status === "error") {
        setChecked(previous);
        toast.error(result.message ?? "Güncellenemedi.");
        return;
      }
      toast.success(next ? `${productName} mevcut.` : `${productName} tükendi.`);
    });
  }

  return (
    <div className="flex items-center gap-2">
      <Switch
        checked={checked}
        onCheckedChange={handleChange}
        disabled={pending}
        aria-label={`${productName} — ${checked ? "mevcut" : "tükendi"}`}
      />
      <span className="text-muted-foreground hidden text-xs sm:inline">
        {checked ? "Mevcut" : "Tükendi"}
      </span>
    </div>
  );
}
