import { LogOut, User as UserIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { logout } from "@/lib/actions/auth";

export function UserMenu({ email, fullName }: { email: string; fullName?: string | null }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="secondary" size="icon" className="rounded-full" />}>
        <UserIcon className="size-4" aria-hidden />
        <span className="sr-only">Hesap menüsünü aç</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <p className="text-sm font-medium">{fullName ?? "Hesap"}</p>
          <p className="text-muted-foreground truncate text-xs">{email}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {/* A form, not an onClick: sign-out mutates the session, so it must not
            be reachable by a prefetch or a GET.

            closeOnClick={false} matters — the default closes the menu on click,
            which unmounts the form mid-submit and the action never runs. The
            redirect inside logout() navigates away instead. */}
        <form action={logout}>
          <DropdownMenuItem
            closeOnClick={false}
            render={<button type="submit" />}
            className="w-full cursor-pointer"
          >
            <LogOut className="size-4" aria-hidden />
            Çıkış yap
          </DropdownMenuItem>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
