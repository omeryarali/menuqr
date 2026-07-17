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
      <SheetContent side="left" className="w-72 p-0">
        <div className="flex h-14 items-center border-b px-4">
          <SheetTitle className="flex items-center gap-2 text-base font-semibold">
            <QrCode className="size-5" aria-hidden />
            MenuQR
          </SheetTitle>
        </div>
        <div className="py-2">
          {/* Close the sheet on navigation — the route changes underneath it
              but Radix keeps it open otherwise. */}
          <NavLinks onNavigate={() => setOpen(false)} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
