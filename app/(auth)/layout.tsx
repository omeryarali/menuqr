import Link from "next/link";

import { QrCode } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-muted/40 flex min-h-svh flex-col items-center justify-center gap-6 p-6">
      <Link href="/" className="flex items-center gap-2 font-semibold">
        <QrCode className="size-5" aria-hidden />
        MenuQR
      </Link>
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
