"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth, ApiError } from "@/lib/auth-context";

export default function LoginPage() {
  const { login, status, user } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    if (status === "authenticated" && user) {
      router.replace(user.role === "MENTOR" ? "/mentor" : "/aspirant");
    }
  }, [status, user, router]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    // If the (free-tier) backend is asleep, tell the user why sign-in is slow.
    const slowTimer = setTimeout(() => setSlow(true), 4000);
    try {
      const loggedInUser = await login(email, password);
      router.replace(loggedInUser.role === "MENTOR" ? "/mentor" : "/aspirant");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't reach the server. Try again.");
    } finally {
      clearTimeout(slowTimer);
      setSlow(false);
      setSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand text-lg font-bold text-paper">
            P
          </span>
          <h1 className="mt-4 text-2xl font-semibold text-ink">Pragati</h1>
          <p className="mt-1 text-sm text-ink-soft">UPSC preparation, tracked properly.</p>
        </div>
        <form
          onSubmit={handleSubmit}
          className="w-full rounded-xl border border-rule bg-paper-raised p-6 shadow-sm sm:p-8"
          noValidate
        >
          <h2 className="text-lg font-semibold text-ink">Sign in to your account</h2>

          <div className="mt-5 space-y-4">
            <label className="block">
              <span className="text-sm font-medium text-ink">Email</span>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1.5 w-full rounded-sm border border-rule bg-paper-raised px-3 py-2 text-sm text-ink"
                placeholder="you@example.com"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-ink">Password</span>
              <input
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1.5 w-full rounded-sm border border-rule bg-paper-raised px-3 py-2 text-sm text-ink"
                placeholder="••••••••"
              />
            </label>
          </div>

          {error && (
            <p role="alert" className="mt-4 text-sm text-status-critical">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="mt-6 w-full rounded-sm bg-brand py-2.5 text-sm font-medium text-paper transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {submitting ? "Signing in…" : "Sign in"}
          </button>

          {slow && (
            <p className="mt-3 text-center text-xs text-ink-soft">
              Waking up the server — this can take up to a minute after a period of inactivity.
            </p>
          )}
        </form>

        <p className="mt-6 text-center text-xs text-ink-soft">
          Private mentor–aspirant workspace · no public sign-up
        </p>
      </div>
    </main>
  );
}
