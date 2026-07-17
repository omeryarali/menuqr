import Link from "next/link";

import { QrCode } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth";

const STEPS = [
  { title: "Restoranını ekle", body: "İsmini ver, menü adresini seç, para birimini ayarla." },
  { title: "Menünü hazırla", body: "Ürünleri kategorilere ayır ve fiyatlarını gir." },
  { title: "Karekodu yazdır", body: "PNG veya SVG olarak indir, masaya koy." },
];

export default async function HomePage() {
  const user = await getCurrentUser();

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex h-14 items-center justify-between px-4 lg:px-8">
        <span className="flex items-center gap-2 font-semibold">
          <QrCode className="size-5" aria-hidden />
          MenuQR
        </span>
        <nav className="flex items-center gap-2">
          {user ? (
            <Button render={<Link href="/dashboard" />} size="sm">
              Panel
            </Button>
          ) : (
            <>
              <Button render={<Link href="/login" />} variant="ghost" size="sm">
                Giriş yap
              </Button>
              <Button render={<Link href="/register" />} size="sm">
                Hemen başla
              </Button>
            </>
          )}
        </nav>
      </header>

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center gap-12 px-4 py-16">
        <div className="space-y-4">
          <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
            Uğraşmadan QR menü.
          </h1>
          <p className="text-muted-foreground max-w-prose text-lg text-pretty">
            Menünüzü bir kez hazırlayın, bir bağlantıda yayınlayın ve her zaman güncel sürümü gösteren
            bir karekod yazdırın. Müşterilerinizin uygulama indirmesine gerek yok.
          </p>
          <div className="flex gap-3 pt-2">
            <Button render={<Link href={user ? "/dashboard" : "/register"} />} size="lg">
              {user ? "Panele git" : "Ücretsiz başla"}
            </Button>
          </div>
        </div>

        <ol className="grid gap-6 sm:grid-cols-3">
          {STEPS.map((step, index) => (
            <li key={step.title} className="space-y-1">
              <span className="text-muted-foreground text-sm font-medium tabular-nums">0{index + 1}</span>
              <h2 className="font-medium">{step.title}</h2>
              <p className="text-muted-foreground text-sm text-pretty">{step.body}</p>
            </li>
          ))}
        </ol>
      </main>
    </div>
  );
}
