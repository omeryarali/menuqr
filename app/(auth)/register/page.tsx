import type { Metadata } from "next";

import { RegisterForm } from "@/components/auth/register-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Hesap oluştur",
};

export default function RegisterPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-display text-2xl">Hesabınızı oluşturun</CardTitle>
        <CardDescription>Dakikalar içinde QR menünüzü yayına alın.</CardDescription>
      </CardHeader>
      <CardContent>
        <RegisterForm />
      </CardContent>
    </Card>
  );
}
