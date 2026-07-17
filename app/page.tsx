import Link from "next/link";

import { FolderTree, QrCode, Store, UtensilsCrossed } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth";

const STEPS = [
  {
    icon: Store,
    title: "Restoranını ekle",
    body: "İsmini ver, menü adresini seç, para birimini ayarla. Dakikalar sürer.",
  },
  {
    icon: FolderTree,
    title: "Menünü hazırla",
    body: "Ürünleri kategorilere ayır, fiyatları gir, bir tema seç.",
  },
  {
    icon: QrCode,
    title: "Karekodu yazdır",
    body: "PNG veya SVG olarak indir, masaya koy. Menü her zaman güncel.",
  },
];

export default async function HomePage() {
  const user = await getCurrentUser();

  return (
    <div className="relative flex flex-1 flex-col overflow-hidden">
      {/* Soft brand glow behind the hero. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[520px]"
        style={{
          background:
            "radial-gradient(50% 60% at 50% 0%, color-mix(in oklch, var(--primary) 12%, transparent), transparent 70%)",
        }}
      />

      <header className="bg-background/70 sticky top-0 z-30 border-b backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-4 lg:px-8">
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
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 lg:px-8">
        {/* Hero */}
        <section className="grid items-center gap-12 py-16 lg:grid-cols-2 lg:py-24">
          <div className="space-y-6">
            <span className="bg-muted text-muted-foreground inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium">
              <span className="bg-primary size-1.5 rounded-full" />
              Kurulumu 5 dakika
            </span>
            <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl">
              Uğraşmadan QR menü.
            </h1>
            <p className="text-muted-foreground max-w-prose text-lg text-pretty">
              Menünüzü bir kez hazırlayın, bir bağlantıda yayınlayın ve her zaman güncel sürümü gösteren bir
              karekod yazdırın. Müşterilerinizin uygulama indirmesine gerek yok.
            </p>
            <div className="flex flex-wrap gap-3 pt-1">
              <Button render={<Link href={user ? "/dashboard" : "/register"} />} size="lg">
                {user ? "Panele git" : "Ücretsiz başla"}
              </Button>
              <Button render={<Link href="#nasil" />} variant="outline" size="lg">
                Nasıl çalışır?
              </Button>
            </div>
          </div>

          {/* Phone-ish preview of a themed menu with a QR chip. */}
          <div className="relative mx-auto w-full max-w-sm">
            <div
              className="rounded-3xl border p-6 shadow-xl"
              style={{ backgroundColor: "#f7f2e9", borderColor: "#e6dcc9", color: "#2b2118" }}
            >
              <div className="space-y-1 text-center">
                <p className="text-2xl font-semibold" style={{ fontFamily: "Georgia, serif" }}>
                  Çorbacı Ömer
                </p>
                <span className="mx-auto block h-px w-12" style={{ backgroundColor: "#9a6b3f", opacity: 0.7 }} />
              </div>
              <div className="mt-6 space-y-4" style={{ fontFamily: "Georgia, serif" }}>
                <p className="text-xs tracking-wide" style={{ color: "#9a6b3f" }}>
                  ÇORBALAR
                </p>
                {[
                  ["Mercimek Çorbası", "₺85,50"],
                  ["Ezogelin", "₺80,00"],
                  ["İşkembe", "₺120,00"],
                ].map(([name, price]) => (
                  <div key={name} className="flex items-baseline gap-2 text-sm">
                    <span>{name}</span>
                    <span className="flex-1 border-b border-dotted" style={{ borderColor: "#d8caae" }} />
                    <span style={{ color: "#9a6b3f" }}>{price}</span>
                  </div>
                ))}
              </div>
            </div>
            {/* QR chip peeking from the corner. */}
            <div className="bg-background absolute -bottom-4 -right-3 flex size-20 items-center justify-center rounded-2xl border shadow-lg">
              <QrCode className="size-12" aria-hidden />
            </div>
          </div>
        </section>

        {/* Steps */}
        <section id="nasil" className="scroll-mt-20 border-t py-16 lg:py-20">
          <h2 className="text-center text-2xl font-semibold tracking-tight">Üç adımda yayında</h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {STEPS.map((step, index) => (
              <div key={step.title} className="bg-card rounded-xl border p-6">
                <div className="bg-primary text-primary-foreground flex size-10 items-center justify-center rounded-lg">
                  <step.icon className="size-5" aria-hidden />
                </div>
                <div className="mt-4 flex items-center gap-2">
                  <span className="text-muted-foreground text-sm font-medium tabular-nums">0{index + 1}</span>
                  <h3 className="font-medium">{step.title}</h3>
                </div>
                <p className="text-muted-foreground mt-1.5 text-sm text-pretty">{step.body}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 flex flex-col items-center gap-4 text-center">
            <div className="text-muted-foreground flex items-center gap-2 text-sm">
              <UtensilsCrossed className="size-4" aria-hidden />
              Sınırsız ürün, üç hazır tema, anında güncelleme
            </div>
            <Button render={<Link href={user ? "/dashboard" : "/register"} />} size="lg">
              {user ? "Panele git" : "Ücretsiz başla"}
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t">
        <div className="text-muted-foreground mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-6 text-sm lg:px-8">
          <span className="flex items-center gap-2">
            <QrCode className="size-4" aria-hidden />
            MenuQR
          </span>
          <span>QR menü platformu</span>
        </div>
      </footer>
    </div>
  );
}
