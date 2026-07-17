"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { FolderTree, LayoutDashboard, QrCode, Store, UtensilsCrossed } from "lucide-react";

import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/dashboard", label: "Genel bakış", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/restaurants", label: "Restoranlar", icon: Store },
  { href: "/dashboard/categories", label: "Kategoriler", icon: FolderTree },
  { href: "/dashboard/products", label: "Ürünler", icon: UtensilsCrossed },
  { href: "/dashboard/qr-codes", label: "Karekodlar", icon: QrCode },
] as const;

export function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="grid gap-1 px-2">
      {LINKS.map(({ href, label, icon: Icon, ...rest }) => {
        // Without `exact`, /dashboard would light up on every child route.
        const isActive = "exact" in rest && rest.exact ? pathname === href : pathname.startsWith(href);

        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
            )}
          >
            <Icon className="size-4" aria-hidden />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
