"use client";

import { RequireRole } from "@/components/RequireRole";
import { AppShell } from "@/components/AppShell";
import { DashboardAnalytics } from "@/components/DashboardAnalytics";
import { useAuth } from "@/lib/auth-context";

export default function AspirantDashboardPage() {
  return (
    <RequireRole role="ASPIRANT">
      <AppShell>
        <AspirantDashboardContent />
      </AppShell>
    </RequireRole>
  );
}

function AspirantDashboardContent() {
  const { user } = useAuth();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-ink">
          Welcome back, {user?.displayName}
        </h1>
        <p className="mt-1 text-ink-soft">Here&rsquo;s where your preparation actually stands.</p>
      </div>

      <DashboardAnalytics />
    </div>
  );
}
