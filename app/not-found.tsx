import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
      <p className="text-muted-foreground text-sm font-medium">404</p>
      <h1 className="text-2xl font-semibold tracking-tight">Bu sayfa bulunamadı</h1>
      <p className="text-muted-foreground max-w-sm text-sm text-pretty">
        Aradığınız menü yayından kaldırılmış ya da bağlantı hatalı olabilir.
      </p>
      <Button render={<Link href="/" />} variant="outline" className="mt-2">
        Ana sayfaya dön
      </Button>
    </div>
  );
}
