import Link from "next/link";
import { Bell, ClipboardList, Home, LogOut, Plane, Plus, UserRound, UsersRound } from "lucide-react";
import { logoutAction } from "@/app/actions/auth";
import type { Profile } from "@/lib/data";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/posts", label: "All Posts", icon: ClipboardList },
  { href: "/posts/new", label: "Post", icon: Plus },
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

  return (
    <div className="min-h-screen bg-[#f6f8f7] text-zinc-950">
      <header className="sticky top-0 z-20 border-b border-zinc-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <Link className="flex items-center gap-2" href="/dashboard">
            <span className="flex h-9 w-9 items-center justify-center rounded-md bg-teal-700 text-white">
              <Plane aria-hidden="true" size={20} />
            </span>
            <span>
              <span className="block text-base font-bold">Tradevya</span>
              <span className="block text-xs text-zinc-500">{airportCode} / {stationName}</span>
            </span>
          </Link>
          <div className="hidden items-center gap-2 md:flex">
            <span className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-medium text-zinc-700">{companyName}</span>
            <form action={logoutAction}>
              <button className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-zinc-200 text-zinc-600 hover:bg-zinc-100" title="Log out" type="submit">
                <LogOut aria-hidden="true" size={18} />
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-5 md:grid-cols-[220px_1fr] md:py-8">
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
                    <span className="rounded-md bg-amber-100 px-2 py-0.5 text-xs text-amber-900">{unreadCount}</span>
                  ) : null}
                </Link>
              );
            })}
            <Link className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold text-zinc-700 hover:bg-white hover:text-zinc-950" href="/airport-board">
              <UsersRound aria-hidden="true" size={18} />
              Airport Board
            </Link>
          </nav>
        </aside>

        <main className="pb-24 md:pb-0">{children}</main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-zinc-200 bg-white md:hidden">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link className="relative flex flex-col items-center gap-1 px-1 py-2 text-[11px] font-semibold text-zinc-600" href={item.href} key={item.href}>
              <Icon aria-hidden="true" size={20} />
              <span>{item.label}</span>
              {item.href === "/notifications" && unreadCount > 0 ? (
                <span className="absolute right-5 top-1 rounded-md bg-amber-500 px-1.5 text-[10px] text-white">{unreadCount}</span>
              ) : null}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
