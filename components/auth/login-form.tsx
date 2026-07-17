"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useActionState } from "react";

import { FieldError } from "@/components/shared/field-error";
import { SubmitButton } from "@/components/shared/submit-button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { login } from "@/lib/actions/auth";
import { idleState } from "@/lib/actions/types";

export function LoginForm() {
  const [state, formAction] = useActionState(login, idleState);
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "";

  const fieldErrors = state.status === "error" ? state.fieldErrors : undefined;

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <input type="hidden" name="next" value={next} />

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

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Şifre</Label>
          <Link
            href="/forgot-password"
            className="text-muted-foreground hover:text-foreground text-xs underline underline-offset-4"
          >
            Şifremi unuttum
          </Link>
        </div>
        <Input id="password" name="password" type="password" autoComplete="current-password" required />
        <FieldError messages={fieldErrors?.password} />
      </div>

      <SubmitButton className="w-full">Giriş yap</SubmitButton>

      <p className="text-muted-foreground text-center text-sm">
        Hesabınız yok mu?{" "}
        <Link href="/register" className="text-foreground underline underline-offset-4">
          Hesap oluşturun
        </Link>
      </p>
    </form>
  );
}
