"use client";

import { useState } from "react";

import { ArrowLeft, Printer } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export type PrintVariant = "poster" | "cards";

/**
 * On-screen controls for the print sheet. Hidden from the printout itself by
 * `print:hidden`, so what comes out of the printer is only the artwork.
 */
export function PrintControls({
  variant,
  onVariantChange,
}: {
  variant: PrintVariant;
  onVariantChange: (next: PrintVariant) => void;
}) {
  return (
    <div className="bg-background sticky top-0 z-10 border-b print:hidden">
      <div className="mx-auto flex w-full max-w-3xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <Button variant="ghost" size="sm" render={<Link href="/dashboard/qr-codes" />}>
          <ArrowLeft className="size-4" aria-hidden />
          Karekodlar
        </Button>

        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border p-0.5">
            {(
              [
                ["poster", "Poster"],
                ["cards", "Masa kartı"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => onVariantChange(value)}
                className={
                  variant === value
                    ? "bg-primary text-primary-foreground rounded-md px-3 py-1.5 text-sm font-medium"
                    : "text-muted-foreground hover:text-foreground rounded-md px-3 py-1.5 text-sm"
                }
              >
                {label}
              </button>
            ))}
          </div>

          <Button size="sm" onClick={() => window.print()}>
            <Printer className="size-4" aria-hidden />
            Yazdır
          </Button>
        </div>
      </div>
    </div>
  );
}

/** Wraps the sheet so the variant toggle can drive which layout renders. */
export function PrintSheet({ poster, cards }: { poster: React.ReactNode; cards: React.ReactNode }) {
  const [variant, setVariant] = useState<PrintVariant>("poster");

  return (
    <>
      <PrintControls variant={variant} onVariantChange={setVariant} />
      {variant === "poster" ? poster : cards}
    </>
  );
}
