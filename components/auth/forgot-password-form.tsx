"use client";

import Link from "next/link";
import { useActionState } from "react";

import { FieldError } from "@/components/shared/field-error";
import { SubmitButton } from "@/components/shared/submit-button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { forgotPassword } from "@/lib/actions/auth";
import { idleState } from "@/lib/actions/types";

export function ForgotPasswordForm() {
  const [state, formAction] = useActionState(forgotPassword, idleState);
  const fieldErrors = state.status === "error" ? state.fieldErrors : undefined;

  if (state.status === "success") {
    return (
      <div className="space-y-4">
        <Alert>
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
        <p className="text-muted-foreground text-center text-sm">
          <Link href="/login" className="text-foreground underline underline-offset-4">
            Girişe dön
          </Link>
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4" noValidate>
      {state.status === "error" && !fieldErrors ? (
        <Alert variant="destructive">
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="email">E-posta</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="ornek@restoran.com"
          required
        />
        <FieldError messages={fieldErrors?.email} />
      </div>

      <SubmitButton className="w-full">Sıfırlama bağlantısı gönder</SubmitButton>

      <p className="text-muted-foreground text-center text-sm">
        Şifrenizi hatırladınız mı?{" "}
        <Link href="/login" className="text-foreground underline underline-offset-4">
          Giriş yapın
        </Link>
      </p>
    </form>
  );
}
