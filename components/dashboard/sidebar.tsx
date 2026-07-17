import Link from "next/link";

import { QrCode } from "lucide-react";

import { NavLinks } from "./nav-links";

/** Fixed sidebar for md+ viewports. Mobile uses the Sheet in <MobileNav />. */
export function Sidebar() {
  return (
    <aside className="bg-muted/40 hidden border-r md:block">
      <div className="flex h-full max-h-svh flex-col gap-2">
        <div className="flex h-14 items-center border-b px-4 lg:h-[60px]">
          <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
            <QrCode className="size-5" aria-hidden />
            MenuQR
          </Link>
        </div>
        <div className="flex-1 overflow-auto py-2">
          <NavLinks />
        </div>
      </div>
    </aside>
  );
}
