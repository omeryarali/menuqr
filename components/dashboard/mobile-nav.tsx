"use client";

import { useState } from "react";

import { Menu, QrCode } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

import { NavLinks } from "./nav-links";

export function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={<Button variant="outline" size="icon" className="shrink-0 md:hidden" />}>
        <Menu className="size-5" aria-hidden />
        <span className="sr-only">Menüyü aç</span>
      </SheetTrigger>
      {/* Same dark indigo surface as the desktop sidebar, so NavLinks (styled
          with sidebar-* tokens) reads correctly. SheetTitle hardcodes
          text-foreground, hence the explicit override. */}
      <SheetContent
        side="left"
        className="bg-sidebar text-sidebar-foreground border-sidebar-border w-72 p-0"
      >
        <div className="border-sidebar-border flex h-14 items-center border-b px-4">
          <SheetTitle className="text-sidebar-foreground flex items-center gap-2.5 text-base font-semibold">
            <span className="bg-brand-gradient flex size-7 items-center justify-center rounded-lg text-white">
              <QrCode className="size-4" aria-hidden />
            </span>
            MenuQR
          </SheetTitle>
        </div>
        <div className="py-2">
          {/* Close the sheet on navigation — the route changes underneath it
              but the sheet keeps itself open otherwise. */}
          <NavLinks onNavigate={() => setOpen(false)} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
