"use client";

import { RequireRole } from "@/components/RequireRole";
import { AppShell } from "@/components/AppShell";
import { DashboardAnalytics } from "@/components/DashboardAnalytics";
import { useAuth } from "@/lib/auth-context";

export default function MentorDashboardPage() {
  return (
    <RequireRole role="MENTOR">
      <AppShell>
        <MentorDashboardContent />
      </AppShell>
    </RequireRole>
  );
}

function MentorDashboardContent() {
  const { user, viewing } = useAuth();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-ink">
          Welcome back, {user?.displayName}
        </h1>
        <p className="mt-1 text-ink-soft">
          {viewing ? `${viewing.displayName}'s` : "Your aspirant's"} preparation, from real data.
        </p>
      </div>

      <DashboardAnalytics />
    </div>
  );
}
