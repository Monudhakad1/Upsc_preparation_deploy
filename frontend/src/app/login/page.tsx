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

  useEffect(() => {
    if (status === "authenticated" && user) {
      router.replace(user.role === "MENTOR" ? "/mentor" : "/aspirant");
    }
  }, [status, user, router]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const loggedInUser = await login(email, password);
      router.replace(loggedInUser.role === "MENTOR" ? "/mentor" : "/aspirant");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't reach the server. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen flex-col md:flex-row">
      {/* Left panel: identity. Quiet, no imagery - the ruled lines are the
          one signature motif, standing in for the ledger this app keeps. */}
      <div className="relative flex flex-1 flex-col justify-between overflow-hidden bg-brand px-10 py-12 text-paper md:px-16 md:py-16">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(to bottom, transparent, transparent 35px, #f6f3ec 35px, #f6f3ec 36px)",
          }}
        />
        <div className="relative">
          <p className="font-data text-xs uppercase tracking-[0.2em] text-paper/60">
            Mentor · Aspirant
          </p>
          <h1 className="mt-4 font-display text-5xl font-semibold leading-[1.05] md:text-6xl">
            Pragati
          </h1>
          <p className="mt-3 max-w-sm text-sm text-paper/70">
            प्रगति — progress. A private ledger for UPSC CSE preparation: what&rsquo;s
            studied, what&rsquo;s revised, and what&rsquo;s next.
          </p>
        </div>
        <div className="relative hidden text-xs text-paper/50 md:block">
          Syllabus coverage · Revision depth · PYQs · Answer writing · Tests
        </div>
      </div>

      {/* Right panel: the form */}
      <div className="flex flex-1 items-center justify-center px-6 py-16">
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-sm rounded-sm border border-rule bg-paper-raised p-8 shadow-sm"
          noValidate
        >
          <h2 className="font-display text-2xl font-semibold text-ink">Sign in</h2>
          <p className="mt-1 text-sm text-ink-soft">Use the account your mentor set up for you.</p>

          <div className="mt-6 space-y-4">
            <label className="block">
              <span className="text-sm font-medium text-ink">Email</span>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-sm border border-rule bg-paper px-3 py-2 text-ink outline-none focus-visible:border-brand"
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
                className="mt-1 w-full rounded-sm border border-rule bg-paper px-3 py-2 text-ink outline-none focus-visible:border-brand"
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
            className="mt-6 w-full rounded-sm bg-brand py-2.5 font-medium text-paper transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {submitting ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </main>
  );
}
