import { Navbar } from "@/components/dashboard/navbar";
import { Sidebar } from "@/components/dashboard/sidebar";
import { getProfile, requireUser } from "@/lib/auth";

/**
 * Middleware already redirects anonymous users away from /dashboard. requireUser
 * repeats that check on purpose — defense in depth, since middleware can be
 * bypassed by rendering paths that don't traverse it.
 */
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const profile = await getProfile();

  return (
    <div className="grid min-h-svh w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      <Sidebar />
      <div className="flex min-w-0 flex-col">
        <Navbar email={user.email ?? ""} fullName={profile?.full_name} />
        <main className="flex flex-1 flex-col gap-6 p-4 lg:gap-8 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
