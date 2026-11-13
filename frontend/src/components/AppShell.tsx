"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const isMentor = user?.role === "MENTOR";

  const navItems = [
    { label: "Dashboard", href: isMentor ? "/mentor" : "/aspirant" },
    { label: "Syllabus", href: "/syllabus" },
    { label: "PYQs", href: "/pyqs" },
    { label: "Questions", href: "/questions" },
    { label: "Daily Goals", href: "/goals" },
  ];

  const initials = (user?.displayName ?? "?")
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-20 border-b border-rule bg-paper-raised/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-6 px-4 sm:px-6">
          <Link href={navItems[0].href} className="flex shrink-0 items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-brand text-xs font-bold text-paper">
              P
            </span>
            <span className="text-[15px] font-semibold text-ink">Pragati</span>
          </Link>

          <nav className="hidden flex-1 items-center gap-1 md:flex">
            {navItems.map((item) => (
              <NavLink key={item.href} {...item} active={pathname === item.href} />
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-3">
            <span className="hidden rounded-full bg-brand-soft px-2 py-0.5 text-[11px] font-medium text-ink-soft sm:inline">
              {isMentor ? "Mentor" : "Aspirant"}
            </span>
            <span
              className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-soft text-xs font-semibold text-ink"
              title={user?.displayName}
            >
              {initials}
            </span>
            <button
              onClick={logout}
              className="rounded-md px-2.5 py-1.5 text-sm text-ink-soft transition-colors hover:bg-brand-soft hover:text-ink"
            >
              Sign out
            </button>
          </div>
        </div>

        {/* Mobile: horizontally scrollable nav row */}
        <nav className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 pb-2 md:hidden">
          {navItems.map((item) => (
            <NavLink key={item.href} {...item} active={pathname === item.href} />
          ))}
        </nav>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-10">{children}</main>
    </div>
  );
}

function NavLink({ label, href, active }: { label: string; href: string; active: boolean }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={
        "shrink-0 rounded-md px-3 py-1.5 text-sm transition-colors " +
        (active
          ? "bg-brand-soft font-medium text-ink"
          : "text-ink-soft hover:bg-brand-soft/70 hover:text-ink")
      }
    >
      {label}
    </Link>
  );
}
