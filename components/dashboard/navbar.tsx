import { MobileNav } from "./mobile-nav";
import { UserMenu } from "./user-menu";

export function Navbar({ email, fullName }: { email: string; fullName?: string | null }) {
  return (
    <header className="bg-background sticky top-0 z-30 flex h-14 items-center gap-4 border-b px-4 lg:h-[60px] lg:px-6">
      <MobileNav />
      <div className="flex-1" />
      <UserMenu email={email} fullName={fullName} />
    </header>
  );
}
