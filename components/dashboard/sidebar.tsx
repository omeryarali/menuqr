import Link from "next/link";

import { QrCode } from "lucide-react";

import { NavLinks } from "./nav-links";

/** Fixed sidebar for md+ viewports. Mobile uses the Sheet in <MobileNav />. */
export function Sidebar() {
  return (
    <aside className="bg-sidebar text-sidebar-foreground border-sidebar-border hidden border-r md:block">
      <div className="flex h-full max-h-svh flex-col gap-2">
        <div className="border-sidebar-border flex h-14 items-center border-b px-4 lg:h-[60px]">
          <Link href="/dashboard" className="flex items-center gap-2.5 font-semibold">
            <span className="bg-brand-gradient flex size-7 items-center justify-center rounded-lg text-white">
              <QrCode className="size-4" aria-hidden />
            </span>
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
