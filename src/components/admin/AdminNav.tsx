"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  CalendarDays,
  ChartNoAxesCombined,
  LayoutDashboard,
  MessageCircle,
  PenLine,
  Settings,
  LogOut,
} from "lucide-react";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/studio/new", label: "Generate", icon: PenLine },
  { href: "/admin/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/admin/analytics", label: "Analytics", icon: ChartNoAxesCombined },
  { href: "/admin/studio/engagement", label: "Engage", icon: MessageCircle },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export default function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/admin/session/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <header className="border-b border-cream-line bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
        <div>
          <p className="font-jakarta text-xs font-semibold uppercase tracking-wider text-coal-dim">
            Portfolio Admin
          </p>
          <h1 className="font-jakarta text-lg font-bold text-coal">
            LinkedIn Studio
          </h1>
        </div>

        <nav className="hidden items-center gap-1 md:flex">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active =
              href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
                  active
                    ? "bg-mint-100 text-mint-800"
                    : "text-coal-muted hover:bg-cream-warm hover:text-coal"
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            );
          })}
        </nav>

        <button
          type="button"
          onClick={logout}
          className="inline-flex items-center gap-2 rounded-lg border border-cream-line px-3 py-2 text-sm text-coal-muted hover:text-coal"
        >
          <LogOut className="h-4 w-4" />
          Log out
        </button>
      </div>

      <nav className="flex gap-1 overflow-x-auto border-t border-cream-line px-4 py-2 md:hidden">
        {NAV.map(({ href, label }) => {
          const active =
            href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`shrink-0 rounded-lg px-3 py-2 text-sm font-medium ${
                active ? "bg-mint-100 text-mint-800" : "text-coal-muted"
              }`}
            >
              {label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
