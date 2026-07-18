import type { Metadata } from "next";
import { Suspense } from "react";

import { LoginForm } from "@/components/auth/login-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: "Giriş yap",
};

export default function LoginPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-display text-2xl">Tekrar hoş geldiniz</CardTitle>
        <CardDescription>Menülerinizi yönetmek için giriş yapın.</CardDescription>
      </CardHeader>
      <CardContent>
        {/* useSearchParams needs a Suspense boundary or the route opts out of
            static rendering entirely. */}
        <Suspense fallback={<Skeleton className="h-64 w-full" />}>
          <LoginForm />
        </Suspense>
      </CardContent>
    </Card>
  );
}
