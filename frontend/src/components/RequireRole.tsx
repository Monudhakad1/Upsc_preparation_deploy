"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import type { Role } from "@/types/auth";

/**
 * Wraps a page and enforces both "must be logged in" and "must have this role".
 * Real authorization still lives server-side (Spring Security + @PreAuthorize
 * added in later phases) - this only controls what the UI shows.
 */
export function RequireRole({
  role,
  children,
}: {
  role: Role;
  children: React.ReactNode;
}) {
  const { status, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    } else if (status === "authenticated" && user && user.role !== role) {
      router.replace(user.role === "MENTOR" ? "/mentor" : "/aspirant");
    }
  }, [status, user, role, router]);

  if (status !== "authenticated" || !user || user.role !== role) {
    return (
      <main className="flex flex-1 items-center justify-center">
        <p className="font-data text-sm text-ink-soft">Loading…</p>
      </main>
    );
  }

  return <>{children}</>;
}
