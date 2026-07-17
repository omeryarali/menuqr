"use client";

import { useFormStatus } from "react-dom";

import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";

/**
 * Submit button wired to the parent <form>'s pending state.
 *
 * Must live in its own component: useFormStatus reads the nearest ancestor
 * form, so it always returns false if called from the component that renders
 * the <form> itself.
 */
export function SubmitButton({
  children,
  className,
  variant,
}: {
  children: React.ReactNode;
  className?: string;
  variant?: React.ComponentProps<typeof Button>["variant"];
}) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending} className={className} variant={variant}>
      {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
      {children}
    </Button>
  );
}
