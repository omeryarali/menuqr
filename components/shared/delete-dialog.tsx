"use client";

import { useState, useTransition } from "react";

import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

/**
 * Confirm-then-delete. `onConfirm` is a Server Action bound to the row id.
 *
 * It may either return an ActionState or redirect (which throws internally in
 * Next). Both are fine: a redirect unwinds before the toast runs.
 */
export function DeleteDialog({
  onConfirm,
  title = "Emin misiniz?",
  description,
  triggerLabel = "Sil",
  triggerVariant = "ghost",
  iconOnly = false,
}: {
  onConfirm: () => Promise<{ status: string; message?: string } | void>;
  title?: string;
  description: string;
  triggerLabel?: string;
  triggerVariant?: React.ComponentProps<typeof Button>["variant"];
  iconOnly?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleConfirm() {
    // AlertDialogAction is a plain Button here, not a Close, so the dialog stays
    // open on click and we close it ourselves only once the action succeeds.
    startTransition(async () => {
      try {
        const result = await onConfirm();
        if (result && result.status === "error") {
          toast.error(result.message ?? "Bir şeyler ters gitti.");
          return;
        }
        toast.success(result?.message ?? "Silindi.");
        setOpen(false);
      } catch (error) {
        // NEXT_REDIRECT propagates as an error; let it through untouched.
        if (error && typeof error === "object" && "digest" in error) throw error;
        toast.error("Bir şeyler ters gitti.");
      }
    });
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger render={<Button variant={triggerVariant} size={iconOnly ? "icon" : "sm"} />}>
        <Trash2 className="size-4" aria-hidden />
        {iconOnly ? <span className="sr-only">{triggerLabel}</span> : triggerLabel}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Vazgeç</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={pending}
            className="bg-destructive text-white hover:bg-destructive/90"
          >
            {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
            Sil
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
