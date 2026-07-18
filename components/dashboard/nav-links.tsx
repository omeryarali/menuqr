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

/**
 * Styled with the sidebar-* tokens (dark indigo surface), so it renders
 * correctly both in the fixed sidebar and in the mobile sheet — both are
 * bg-sidebar. Don't reuse this on a light surface.
 */
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
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground/65 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
            )}
          >
            <Icon className={cn("size-4", isActive && "text-sidebar-primary")} aria-hidden />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
