"use client";

import { useActionState } from "react";

import { FieldError } from "@/components/shared/field-error";
import { SubmitButton } from "@/components/shared/submit-button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updatePassword } from "@/lib/actions/auth";
import { idleState } from "@/lib/actions/types";

export function UpdatePasswordForm() {
  const [state, formAction] = useActionState(updatePassword, idleState);
  const fieldErrors = state.status === "error" ? state.fieldErrors : undefined;

  return (
    <form action={formAction} className="space-y-4" noValidate>
      {state.status === "error" && !fieldErrors ? (
        <Alert variant="destructive">
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="password">Yeni şifre</Label>
        <Input id="password" name="password" type="password" autoComplete="new-password" required />
        <FieldError messages={fieldErrors?.password} />
        <p className="text-muted-foreground text-xs">
          En az 8 karakter; bir büyük harf, bir küçük harf ve bir rakam içermeli.
        </p>
      </div>

      <SubmitButton className="w-full">Şifreyi güncelle</SubmitButton>
    </form>
  );
}
