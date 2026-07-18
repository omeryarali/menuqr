"use client";

import { useTransition } from "react";

import { Loader2, LogOut, User as UserIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { logout } from "@/lib/actions/auth";

export function UserMenu({ email, fullName }: { email: string; fullName?: string | null }) {
  const [pending, startTransition] = useTransition();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="secondary" size="icon" className="rounded-full" />}>
        <UserIcon className="size-4" aria-hidden />
        <span className="sr-only">Hesap menüsünü aç</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {/* DropdownMenuLabel is Base UI's Menu.GroupLabel and THROWS when not
            inside a Menu.Group ("Base UI error #31"), which crashed the whole
            page into the error boundary the moment the menu opened. Radix
            allowed a bare Label; Base UI does not — keep this wrapper. */}
        <DropdownMenuGroup>
          <DropdownMenuLabel className="font-normal">
            <p className="text-sm font-medium">{fullName ?? "Hesap"}</p>
            <p className="text-muted-foreground truncate text-xs">{email}</p>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        {/* No <form> here on purpose. Wrapping a Base UI menu item around a
            type="submit" button made the item submit the form NATIVELY,
            bypassing React's action interception — React traps that with a
            javascript:throw action attribute, which crashed the page into the
            error boundary. Calling the server action from a transition keeps
            the mutation on the server (POST, not GET) without a form. */}
        <DropdownMenuItem
          closeOnClick={false}
          disabled={pending}
          className="cursor-pointer"
          onClick={() => {
            startTransition(async () => {
              // logout() redirects; NEXT_REDIRECT propagates and Next handles
              // the navigation, so nothing to do after the await.
              await logout();
            });
          }}
        >
          {pending ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : (
            <LogOut className="size-4" aria-hidden />
          )}
          Çıkış yap
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
