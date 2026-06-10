import Link from "next/link";
import { Bell, ClipboardList, Home, LogOut, Plane, Plus, ShieldCheck, UserRound, UsersRound } from "lucide-react";
import { logoutAction } from "@/app/actions/auth";
import { isBackendOwnerEmail } from "@/lib/admin";
import type { Profile } from "@/lib/data";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/my-posts", label: "My Posts", icon: ClipboardList },
  { href: "/posts/new", label: "Post", icon: Plus },
  { href: "/notifications", label: "Alerts", icon: Bell },
  { href: "/profile", label: "Profile", icon: UserRound },
];

const mobileNavItems = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/my-posts", label: "My Posts", icon: ClipboardList },
  { href: "/notifications", label: "Alerts", icon: Bell },
  { href: "/profile", label: "Profile", icon: UserRound },
];

export function AppShell({
  children,
  profile,
  unreadCount = 0,
}: {
  children: React.ReactNode;
  profile: Profile | null;
  unreadCount?: number;
}) {
  const companyName = profile?.custom_company_name || profile?.companies?.name || "Company pending";
  const stationName = profile?.stations?.name || "Station pending";
  const airportCode = profile?.airports?.iata_code || "Airport pending";
  const isBackendOwner = isBackendOwnerEmail(profile?.email);

  return (
    <div className="min-h-screen bg-[#f6f8f7] text-zinc-950">
      <header className="sticky top-0 z-20 border-b border-zinc-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-3 py-3 sm:px-4">
          <Link className="flex min-w-0 items-center gap-2" href="/dashboard">
            <span className="flex h-9 w-9 items-center justify-center rounded-md bg-teal-700 text-white">
              <Plane aria-hidden="true" size={20} />
            </span>
            <span className="min-w-0">
              <span className="block text-base font-bold">Tradevya</span>
              <span className="block truncate text-xs text-zinc-500">{airportCode} / {stationName}</span>
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="hidden rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-medium text-zinc-700 md:inline-flex">{companyName}</span>
            {isBackendOwner ? (
              <Link className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-zinc-200 text-zinc-600 hover:bg-zinc-100" href="/admin/moderation" title="Backend">
                <ShieldCheck aria-hidden="true" size={18} />
              </Link>
            ) : null}
            <form action={logoutAction}>
              <button className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-zinc-200 text-zinc-600 hover:bg-zinc-100" title="Log out" type="submit">
                <LogOut aria-hidden="true" size={18} />
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-5 px-3 py-4 sm:px-4 md:grid-cols-[220px_minmax(0,1fr)] md:gap-6 md:py-8">
        <aside className="hidden md:block">
          <nav className="sticky top-24 grid gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  className="flex items-center justify-between rounded-md px-3 py-2 text-sm font-semibold text-zinc-700 hover:bg-white hover:text-zinc-950"
                  href={item.href}
                  key={item.href}
                >
                  <span className="flex items-center gap-2">
                    <Icon aria-hidden="true" size={18} />
                    {item.label}
                  </span>
                  {item.href === "/notifications" && unreadCount > 0 ? (
                    <span className="rounded-md bg-red-100 px-2 py-0.5 text-xs text-red-800">{unreadCount}</span>
                  ) : null}
                </Link>
              );
            })}
            <Link className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold text-zinc-700 hover:bg-white hover:text-zinc-950" href="/airport-board">
              <UsersRound aria-hidden="true" size={18} />
              Airport Board
            </Link>
            {isBackendOwner ? (
              <Link className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold text-zinc-700 hover:bg-white hover:text-zinc-950" href="/admin/moderation">
                <ShieldCheck aria-hidden="true" size={18} />
                Backend
              </Link>
            ) : null}
          </nav>
        </aside>

        <main className="min-w-0 pb-24 md:pb-0">{children}</main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 items-end border-t border-zinc-200 bg-white px-1 pb-1 pt-2 md:hidden">
        {mobileNavItems.slice(0, 2).map((item) => {
          const Icon = item.icon;
          return (
            <Link className="relative flex min-h-14 flex-col items-center justify-center gap-1 px-1 text-[10px] font-bold text-zinc-600" href={item.href} key={item.href}>
              <Icon aria-hidden="true" size={20} />
              <span>{item.label}</span>
            </Link>
          );
        })}
        <Link className="relative -mt-7 flex min-h-16 flex-col items-center justify-start gap-1 text-[10px] font-bold text-teal-800" href="/posts/new">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-teal-700 text-white shadow-lg shadow-teal-900/20 ring-4 ring-white">
            <Plus aria-hidden="true" size={28} />
          </span>
          <span>Post</span>
        </Link>
        {mobileNavItems.slice(2).map((item) => {
          const Icon = item.icon;
          return (
            <Link className="relative flex min-h-14 flex-col items-center justify-center gap-1 px-1 text-[10px] font-bold text-zinc-600" href={item.href} key={item.href}>
              <Icon aria-hidden="true" size={20} />
              <span>{item.label}</span>
              {item.href === "/notifications" && unreadCount > 0 ? (
                <span className="absolute right-4 top-1 rounded-full bg-red-600 px-1.5 text-[10px] text-white">{unreadCount}</span>
              ) : null}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
