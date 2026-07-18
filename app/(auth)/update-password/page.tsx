import type { Metadata } from "next";

import { UpdatePasswordForm } from "@/components/auth/update-password-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Yeni şifre belirle",
};

/**
 * Reached from the recovery email: /auth/callback exchanges the code for a
 * session, then forwards here. requireUser is the gate — middleware only
 * protects /dashboard, so without it an anonymous visitor would see the form
 * and get a confusing error on submit. An expired link means no session, which
 * lands them on /login instead.
 */
export default async function UpdatePasswordPage() {
  await requireUser();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-display text-2xl">Yeni şifre belirleyin</CardTitle>
        <CardDescription>Hesabınız için yeni bir şifre seçin.</CardDescription>
      </CardHeader>
      <CardContent>
        <UpdatePasswordForm />
      </CardContent>
    </Card>
  );
}
