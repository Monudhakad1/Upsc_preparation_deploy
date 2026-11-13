"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { RequireRole } from "@/components/RequireRole";
import { AppShell } from "@/components/AppShell";
import { ListSkeleton } from "@/components/Skeleton";
import { useAuth } from "@/lib/auth-context";
import { adminApi, ApiError } from "@/lib/api";
import { formatDate } from "@/lib/format";
import type { AdminUser, Role } from "@/types/auth";

export default function AdminPage() {
  return (
    <RequireRole role="MENTOR">
      <AppShell requiresAspirant={false}>
        <AdminContent />
      </AppShell>
    </RequireRole>
  );
}

function AdminContent() {
  const { token, user, setViewing } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(() => {
    if (!token) return;
    adminApi
      .listUsers(token)
      .then(setUsers)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Couldn't load users."));
  }, [token]);

  useEffect(load, [load]);

  async function toggleActive(u: AdminUser) {
    if (!token) return;
    setBusyId(u.id);
    try {
      const updated = await adminApi.setActive(u.id, !u.active, token);
      setUsers((prev) => prev?.map((x) => (x.id === updated.id ? updated : x)) ?? null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't update the account.");
    } finally {
      setBusyId(null);
    }
  }

  function openDashboard(u: AdminUser) {
    setViewing({ id: u.id, displayName: u.displayName });
    router.push("/mentor");
  }

  const q = query.trim().toLowerCase();
  const matches = (u: AdminUser) =>
    !q || u.displayName.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
  const aspirants = (users ?? []).filter((u) => u.role === "ASPIRANT" && matches(u));
  const mentors = (users ?? []).filter((u) => u.role === "MENTOR" && matches(u));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-ink">Users</h1>
        <p className="mt-1 text-ink-soft">
          Aspirants sign up themselves. Mentor accounts can only be created here, by a mentor.
        </p>
      </div>

      {error && (
        <div className="rounded-sm border border-status-critical/40 bg-status-critical/5 p-3 text-sm text-status-critical">
          {error}
        </div>
      )}

      <CreateUserForm
        onCreated={(created) => setUsers((prev) => (prev ? [created, ...prev] : [created]))}
      />

      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search by name or email"
        className="w-full max-w-sm rounded-sm border border-rule bg-paper-raised px-3 py-2 text-sm text-ink"
      />

      {users === null ? (
        <ListSkeleton rows={3} />
      ) : (
        <>
          <UserTable
            title="Aspirants"
            users={aspirants}
            empty="No aspirants yet - share the sign-up page with them."
            currentUserId={user?.id}
            busyId={busyId}
            onToggle={toggleActive}
            onOpen={openDashboard}
          />
          <UserTable
            title="Mentors"
            users={mentors}
            empty="No other mentors."
            currentUserId={user?.id}
            busyId={busyId}
            onToggle={toggleActive}
          />
        </>
      )}
    </div>
  );
}

function UserTable({
  title,
  users,
  empty,
  currentUserId,
  busyId,
  onToggle,
  onOpen,
}: {
  title: string;
  users: AdminUser[];
  empty: string;
  currentUserId?: string;
  busyId: string | null;
  onToggle: (u: AdminUser) => void;
  onOpen?: (u: AdminUser) => void;
}) {
  return (
    <section>
      <h2 className="text-lg font-semibold text-ink">
        {title} <span className="text-sm font-normal text-ink-soft">({users.length})</span>
      </h2>
      {users.length === 0 ? (
        <p className="mt-2 text-sm text-ink-soft">{empty}</p>
      ) : (
        <ul className="mt-3 divide-y divide-rule rounded-sm border border-rule bg-paper-raised">
          {users.map((u) => (
            <li key={u.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ink">
                  {u.displayName}
                  {u.id === currentUserId && <span className="ml-2 text-xs text-ink-soft">(you)</span>}
                  {!u.active && (
                    <span className="ml-2 rounded-full bg-status-critical/10 px-2 py-0.5 text-[11px] font-medium text-status-critical">
                      Deactivated
                    </span>
                  )}
                </p>
                <p className="truncate text-xs text-ink-soft">
                  {u.email} · joined {formatDate(u.createdAt.slice(0, 10))}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {onOpen && u.active && (
                  <button
                    onClick={() => onOpen(u)}
                    className="rounded-sm bg-brand px-3 py-1.5 text-xs font-medium text-paper hover:opacity-90"
                  >
                    Open dashboard
                  </button>
                )}
                {u.id !== currentUserId && (
                  <button
                    onClick={() => onToggle(u)}
                    disabled={busyId === u.id}
                    className="rounded-sm border border-rule px-3 py-1.5 text-xs text-ink-soft hover:bg-brand-soft hover:text-ink disabled:opacity-60"
                  >
                    {u.active ? "Deactivate" : "Activate"}
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function CreateUserForm({ onCreated }: { onCreated: (u: AdminUser) => void }) {
  const { token } = useAuth();
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState<Role>("ASPIRANT");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    setError(null);
    setDone(null);
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setSaving(true);
    try {
      const created = await adminApi.createUser({ displayName, email, password, role }, token);
      onCreated(created);
      setDone(`${created.role === "MENTOR" ? "Mentor" : "Aspirant"} account created for ${created.email}.`);
      setDisplayName("");
      setEmail("");
      setPassword("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't create the account.");
    } finally {
      setSaving(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-sm bg-brand px-4 py-2 text-sm font-medium text-paper hover:opacity-90"
      >
        + Create account
      </button>
    );
  }

  const input = "mt-1.5 w-full rounded-sm border border-rule bg-paper-raised px-3 py-2 text-sm text-ink";

  return (
    <form onSubmit={handleSubmit} className="rounded-sm border border-rule bg-paper-raised p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-ink">Create account</h2>
        <button type="button" onClick={() => setOpen(false)} className="text-sm text-ink-soft hover:text-ink">
          Close
        </button>
      </div>

      <div className="mt-4 inline-flex rounded-sm border border-rule p-0.5 text-sm">
        {(["ASPIRANT", "MENTOR"] as Role[]).map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setRole(r)}
            className={
              "rounded-sm px-3 py-1.5 " +
              (role === r ? "bg-brand font-medium text-paper" : "text-ink-soft hover:text-ink")
            }
          >
            {r === "ASPIRANT" ? "Aspirant" : "Mentor"}
          </button>
        ))}
      </div>
      {role === "MENTOR" && (
        <p className="mt-2 text-xs text-status-progress">
          A mentor has full admin access: sees every aspirant and can create or deactivate accounts.
        </p>
      )}

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <label className="block">
          <span className="text-sm font-medium text-ink">Full name</span>
          <input required value={displayName} onChange={(e) => setDisplayName(e.target.value)} className={input} />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-ink">Email</span>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={input} />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-ink">Temporary password</span>
          <input
            type="text"
            required
            minLength={8}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={input}
            placeholder="min. 8 characters"
          />
        </label>
      </div>

      {error && <p className="mt-3 text-sm text-status-critical">{error}</p>}
      {done && <p className="mt-3 text-sm text-status-completed">{done}</p>}

      <button
        type="submit"
        disabled={saving}
        className="mt-4 rounded-sm bg-brand px-4 py-2 text-sm font-medium text-paper hover:opacity-90 disabled:opacity-60"
      >
        {saving ? "Creating…" : `Create ${role === "MENTOR" ? "mentor" : "aspirant"}`}
      </button>
    </form>
  );
}
