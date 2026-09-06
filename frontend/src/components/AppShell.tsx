"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

const NAV_ITEMS = [
  "Dashboard",
  "Syllabus",
  "Revision",
  "PYQs",
  "Questions",
  "Daily Goals",
  "Current Affairs",
  "Answer Writing",
  "Tests",
  "Study Log",
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  function hrefFor(item: string) {
    if (item === "Dashboard") return user?.role === "MENTOR" ? "/mentor" : "/aspirant";
    if (item === "Syllabus") return "/syllabus";
    if (item === "PYQs") return "/pyqs";
    if (item === "Questions") return "/questions";
    if (item === "Daily Goals") return "/goals";
    return null;
  }

  function isActive(item: string) {
    const href = hrefFor(item);
    return href !== null && pathname === href;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-rule bg-paper-raised">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-baseline gap-2">
            <span className="font-display text-xl font-semibold text-ink">Pragati</span>
            <span className="font-data text-xs text-ink-soft">
              {user?.role === "MENTOR" ? "mentor view" : "aspirant view"}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-ink-soft">{user?.displayName}</span>
            <button
              onClick={logout}
              className="rounded-sm border border-rule px-3 py-1.5 text-sm text-ink transition-colors hover:border-brand hover:text-brand"
            >
              Sign out
            </button>
          </div>
        </div>
        <nav className="mx-auto flex max-w-6xl gap-5 overflow-x-auto px-6 pb-3 text-sm text-ink-soft">
          {NAV_ITEMS.map((item) => {
            const href = hrefFor(item);
            const active = isActive(item);
            const className = active
              ? "shrink-0 border-b-2 border-brand pb-1 font-medium text-ink"
              : href
              ? "shrink-0 pb-1 text-ink-soft transition-colors hover:text-brand"
              : "shrink-0 pb-1 opacity-50";

            if (!href) {
              return (
                <span key={item} className={className} title="Arrives in a later phase">
                  {item}
                </span>
              );
            }
            return (
              <Link key={item} href={href} className={className}>
                {item}
              </Link>
            );
          })}
        </nav>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10">{children}</main>
    </div>
  );
}
