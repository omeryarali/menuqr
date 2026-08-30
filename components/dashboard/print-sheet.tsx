"use client";

import { useState } from "react";

import Link from "next/link";

import { ArrowLeft, Printer } from "lucide-react";

import { Button } from "@/components/ui/button";

/**
 * Toolbar + layout switcher for the printable pages.
 *
 * The bar is `print:hidden`, so what reaches the printer is only the artwork.
 * Views are passed as already-rendered nodes rather than a render prop, which
 * keeps the pages themselves server components — only this switcher is client.
 */
export function PrintSheet<T extends string>({
  options,
  views,
  backHref,
  backLabel,
}: {
  options: readonly { value: T; label: string }[];
  views: Record<T, React.ReactNode>;
  backHref: string;
  backLabel: string;
}) {
  const [variant, setVariant] = useState<T>(options[0].value);

  return (
    <>
      <div className="bg-background sticky top-0 z-10 border-b print:hidden">
        <div className="mx-auto flex w-full max-w-3xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <Button variant="ghost" size="sm" render={<Link href={backHref} />}>
            <ArrowLeft className="size-4" aria-hidden />
            {backLabel}
          </Button>

          <div className="flex items-center gap-2">
            {options.length > 1 ? (
              <div className="flex rounded-lg border p-0.5">
                {options.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setVariant(option.value)}
                    className={
                      variant === option.value
                        ? "bg-primary text-primary-foreground rounded-md px-3 py-1.5 text-sm font-medium"
                        : "text-muted-foreground hover:text-foreground rounded-md px-3 py-1.5 text-sm"
                    }
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            ) : null}

            <Button size="sm" onClick={() => window.print()}>
              <Printer className="size-4" aria-hidden />
              Yazdır
            </Button>
          </div>
        </div>
      </div>

      {views[variant]}
    </>
  );
}
