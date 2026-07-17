"use client";

import Link from "next/link";
import { useActionState } from "react";

import { FieldError } from "@/components/shared/field-error";
import { SubmitButton } from "@/components/shared/submit-button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { register } from "@/lib/actions/auth";
import { idleState } from "@/lib/actions/types";

export function RegisterForm() {
  const [state, formAction] = useActionState(register, idleState);
  const fieldErrors = state.status === "error" ? state.fieldErrors : undefined;

  if (state.status === "success") {
    return (
      <Alert>
        <AlertDescription>{state.message}</AlertDescription>
      </Alert>
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
        <Label htmlFor="fullName">Ad soyad</Label>
        <Input id="fullName" name="fullName" autoComplete="name" placeholder="Ayşe Yılmaz" required />
        <FieldError messages={fieldErrors?.fullName} />
      </div>

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
        <Label htmlFor="password">Şifre</Label>
        <Input id="password" name="password" type="password" autoComplete="new-password" required />
        <FieldError messages={fieldErrors?.password} />
        <p className="text-muted-foreground text-xs">
          En az 8 karakter; bir büyük harf, bir küçük harf ve bir rakam içermeli.
        </p>
      </div>

      <SubmitButton className="w-full">Hesap oluştur</SubmitButton>

      <p className="text-muted-foreground text-center text-sm">
        Zaten hesabınız var mı?{" "}
        <Link href="/login" className="text-foreground underline underline-offset-4">
          Giriş yapın
        </Link>
      </p>
    </form>
  );
}
