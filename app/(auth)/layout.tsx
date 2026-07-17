import Link from "next/link";

import { QrCode } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center gap-6 overflow-hidden p-6">
      {/* Subtle brand glow, same language as the landing hero. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(45% 45% at 50% 0%, color-mix(in oklch, var(--primary) 10%, transparent), transparent 70%)",
        }}
      />
      <Link href="/" className="flex items-center gap-2 text-lg font-semibold">
        <QrCode className="size-5" aria-hidden />
        MenuQR
      </Link>
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
