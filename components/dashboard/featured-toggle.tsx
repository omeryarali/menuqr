"use client";

import { useState, useTransition } from "react";

import { Star } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { toggleProductFeatured } from "@/lib/actions/products";
import { cn } from "@/lib/utils";

/**
 * One-tap "chef's recommendation" star.
 *
 * Same optimistic pattern as AvailabilityToggle: flip locally, revert on
 * failure. Re-syncs from props during render rather than in an effect, which
 * react-hooks/set-state-in-effect would reject.
 */
export function FeaturedToggle({
  productId,
  productName,
  isFeatured,
}: {
  productId: string;
  productName: string;
  isFeatured: boolean;
}) {
  const [featured, setFeatured] = useState(isFeatured);
  const [pending, startTransition] = useTransition();

  const [seen, setSeen] = useState(isFeatured);
  if (isFeatured !== seen) {
    setSeen(isFeatured);
    setFeatured(isFeatured);
  }

  function handleClick() {
    const next = !featured;
    const previous = featured;
    setFeatured(next);

    startTransition(async () => {
      const result = await toggleProductFeatured(productId, next);
      if (result.status === "error") {
        setFeatured(previous);
        toast.error(result.message ?? "Güncellenemedi.");
        return;
      }
      toast.success(next ? `${productName} öne çıkarıldı.` : `${productName} öne çıkarmadan kaldırıldı.`);
    });
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleClick}
      disabled={pending}
      aria-pressed={featured}
      aria-label={`${productName} — ${featured ? "öne çıkarmayı kaldır" : "öne çıkar"}`}
    >
      <Star
        className={cn("size-4", featured ? "fill-primary text-primary" : "text-muted-foreground")}
        aria-hidden
      />
    </Button>
  );
}
