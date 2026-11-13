"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { adminApi } from "@/lib/api";
import { Skeleton } from "@/components/Skeleton";
import type { AdminUser } from "@/types/auth";

/**
 * @param requiresAspirant pages that show one aspirant's data (default). For a
 *   mentor they only render once an aspirant is selected; the Users page opts out.
 */
export function AppShell({
  children,
  requiresAspirant = true,
}: {
  children: React.ReactNode;
  requiresAspirant?: boolean;
}) {
  const { user, token, logout, viewing, setViewing } = useAuth();
  const pathname = usePathname();
  const isMentor = user?.role === "MENTOR";

  // Mentor: every active aspirant, for the "Viewing" switcher.
  const [aspirants, setAspirants] = useState<AdminUser[] | null>(null);
  useEffect(() => {
    if (!isMentor || !token) return;
    adminApi
      .listUsers(token)
      .then((users) => setAspirants(users.filter((u) => u.role === "ASPIRANT" && u.active)))
      .catch(() => setAspirants([]));
  }, [isMentor, token]);

  // Keep the selection valid: default to the first aspirant, drop a removed one.
  useEffect(() => {
    if (!isMentor || aspirants === null) return;
    if (viewing && aspirants.some((a) => a.id === viewing.id)) return;
    const first = aspirants[0];
    setViewing(first ? { id: first.id, displayName: first.displayName } : null);
  }, [isMentor, aspirants, viewing, setViewing]);

  const navItems = [
    { label: "Dashboard", href: isMentor ? "/mentor" : "/aspirant" },
    { label: "Syllabus", href: "/syllabus" },
    { label: "PYQs", href: "/pyqs" },
    { label: "Questions", href: "/questions" },
    { label: "Daily Goals", href: "/goals" },
    ...(isMentor ? [{ label: "Users", href: "/admin" }] : []),
  ];

  const initials = (user?.displayName ?? "?")
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  let content: React.ReactNode = children;
  if (isMentor && requiresAspirant) {
    if (aspirants === null || (aspirants.length > 0 && !viewing)) {
      content = (
        <div className="space-y-4" role="status" aria-label="Loading">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-40" />
        </div>
      );
    } else if (aspirants.length === 0) {
      content = (
        <div className="rounded-sm border border-rule bg-paper-raised p-8 text-center">
          <h2 className="text-lg font-semibold text-ink">No aspirants yet</h2>
          <p className="mt-1 text-sm text-ink-soft">
            Aspirants can sign up themselves from the login page, or you can create an account for them.
          </p>
          <Link
            href="/admin"
            className="mt-4 inline-block rounded-sm bg-brand px-4 py-2 text-sm font-medium text-paper hover:opacity-90"
          >
            Manage users
          </Link>
        </div>
      );
    } else {
      // Remount the page when the mentor switches aspirant, so it refetches.
      content = <div key={viewing?.id}>{children}</div>;
    }
  }

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

      {isMentor && requiresAspirant && aspirants && aspirants.length > 0 && (
        <div className="border-b border-rule bg-brand-soft/60">
          <div className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-2 text-sm sm:px-6">
            <label htmlFor="viewing-aspirant" className="shrink-0 text-ink-soft">
              Viewing
            </label>
            <select
              id="viewing-aspirant"
              value={viewing?.id ?? ""}
              onChange={(e) => {
                const next = aspirants.find((a) => a.id === e.target.value);
                if (next) setViewing({ id: next.id, displayName: next.displayName });
              }}
              className="min-w-0 max-w-xs rounded-sm border border-rule bg-paper-raised px-2 py-1 text-sm font-medium text-ink"
            >
              {aspirants.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.displayName} ({a.email})
                </option>
              ))}
            </select>
            <span className="hidden text-xs text-ink-soft sm:inline">
              {aspirants.length} aspirant{aspirants.length === 1 ? "" : "s"}
            </span>
          </div>
        </div>
      )}

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-10">{content}</main>
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
