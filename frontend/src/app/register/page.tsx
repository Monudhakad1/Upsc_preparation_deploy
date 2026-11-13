"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth, ApiError } from "@/lib/auth-context";

export default function RegisterPage() {
  const { register, status, user } = useAuth();
  const router = useRouter();

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
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
    if (!displayName.trim() || !email.trim()) {
      setError("Enter your name and email.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    setSubmitting(true);
    try {
      await register(displayName, email, password);
      router.replace("/aspirant");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't reach the server. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const input = "mt-1.5 w-full rounded-sm border border-rule bg-paper-raised px-3 py-2 text-sm text-ink";

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
          <h2 className="text-lg font-semibold text-ink">Create your aspirant account</h2>
          <p className="mt-1 text-xs text-ink-soft">
            Track syllabus, revisions, PYQs and answer writing. Your mentor can follow your progress.
          </p>

          <div className="mt-5 space-y-4">
            <label className="block">
              <span className="text-sm font-medium text-ink">Full name</span>
              <input
                required
                autoComplete="name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className={input}
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-ink">Email</span>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={input}
                placeholder="you@example.com"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-ink">Password</span>
              <input
                type="password"
                required
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={input}
                placeholder="min. 8 characters"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-ink">Confirm password</span>
              <input
                type="password"
                required
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className={input}
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
            {submitting ? "Creating account…" : "Create account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-ink-soft">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-ink hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
