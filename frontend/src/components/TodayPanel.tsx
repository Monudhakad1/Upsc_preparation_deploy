"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { goalApi, questionApi } from "@/lib/api";
import { upcomingMilestones } from "@/lib/exam";
import { formatDate, todayISO } from "@/lib/format";
import type { DailyGoal, Question } from "@/types/syllabus";

/**
 * Top of the dashboard: exam countdown + "Today's plan" (today's targets and
 * pending answer-writing) - the two things an aspirant checks first every day.
 */
export function TodayPanel({ neverRevisedCount }: { neverRevisedCount: number }) {
  const { token, user } = useAuth();
  const isMentor = user?.role === "MENTOR";
  const [goals, setGoals] = useState<DailyGoal[] | null>(null);
  const [questions, setQuestions] = useState<Question[] | null>(null);

  useEffect(() => {
    if (!token) return;
    goalApi.list(token).then(setGoals).catch(() => setGoals([]));
    questionApi.list(token).then(setQuestions).catch(() => setQuestions([]));
  }, [token]);

  const today = todayISO();
  const todaysGoals = (goals ?? []).filter((g) => g.goalDate === today);
  const doneToday = todaysGoals.filter((g) => g.status === "COMPLETED").length;
  const pendingAnswers = (questions ?? []).filter((q) => !q.submission);
  const overdue = pendingAnswers.filter((q) => q.deadline && q.deadline < today).length;
  const milestones = upcomingMilestones();

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {/* Exam countdown */}
      <section className="rounded-sm border border-rule bg-brand p-5 text-paper">
        <p className="text-xs font-medium uppercase tracking-wide text-paper/60">Exam countdown</p>
        {milestones.length === 0 ? (
          <p className="mt-3 text-sm text-paper/80">Next UPSC calendar dates not added yet.</p>
        ) : (
          <div className="mt-3 space-y-4">
            {milestones.map((m, i) => (
              <div key={m.label}>
                <p className={i === 0 ? "text-4xl font-semibold" : "text-2xl font-semibold"}>
                  {m.days}
                  <span className="ml-1.5 text-sm font-normal text-paper/70">
                    {m.days === 1 ? "day" : "days"}
                  </span>
                </p>
                <p className="text-sm text-paper/80">
                  to {m.label} · {formatDate(m.date)}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Today's plan */}
      <section className="rounded-sm border border-rule bg-paper-raised p-5 lg:col-span-2">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="text-lg font-semibold text-ink">Today&rsquo;s plan</h2>
          <span className="text-xs text-ink-soft">{formatDate(today)}</span>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium uppercase tracking-wide text-ink-soft">Targets</p>
              {todaysGoals.length > 0 && (
                <span className="text-xs text-ink-soft">
                  {doneToday}/{todaysGoals.length} done
                </span>
              )}
            </div>
            {goals === null ? (
              <p className="mt-2 text-sm text-ink-soft">Loading…</p>
            ) : todaysGoals.length === 0 ? (
              <p className="mt-2 text-sm text-ink-soft">
                {isMentor ? "No targets set for today. " : "No targets from your mentor today. "}
                <Link href="/goals" className="text-status-revision hover:underline">
                  {isMentor ? "Assign one" : "See all goals"}
                </Link>
              </p>
            ) : (
              <ul className="mt-2 space-y-1.5">
                {todaysGoals.slice(0, 5).map((g) => (
                  <li key={g.id} className="flex items-start gap-2 text-sm">
                    <span
                      className={
                        "mt-1 h-3.5 w-3.5 shrink-0 rounded-full border " +
                        (g.status === "COMPLETED"
                          ? "border-status-completed bg-status-completed"
                          : "border-rule")
                      }
                    />
                    <span className={g.status === "COMPLETED" ? "text-ink-soft line-through" : "text-ink"}>
                      {g.title}
                    </span>
                  </li>
                ))}
                {todaysGoals.length > 5 && (
                  <li className="text-xs text-ink-soft">
                    <Link href="/goals" className="hover:underline">
                      + {todaysGoals.length - 5} more
                    </Link>
                  </li>
                )}
              </ul>
            )}
          </div>

          <div className="space-y-3">
            <PlanStat
              href="/questions"
              label="Answer writing pending"
              value={questions === null ? "…" : String(pendingAnswers.length)}
              hint={overdue > 0 ? `${overdue} overdue` : undefined}
              tone={overdue > 0 ? "critical" : "neutral"}
            />
            <PlanStat
              href="/syllabus"
              label="Completed, never revised"
              value={String(neverRevisedCount)}
              hint={neverRevisedCount > 0 ? "do R1 for these first" : undefined}
              tone={neverRevisedCount > 0 ? "warn" : "neutral"}
            />
          </div>
        </div>
      </section>
    </div>
  );
}

function PlanStat({
  href,
  label,
  value,
  hint,
  tone,
}: {
  href: string;
  label: string;
  value: string;
  hint?: string;
  tone: "neutral" | "warn" | "critical";
}) {
  const hintColor =
    tone === "critical" ? "text-status-critical" : tone === "warn" ? "text-status-progress" : "text-ink-soft";
  return (
    <Link
      href={href}
      className="flex items-center justify-between rounded-sm border border-rule px-3 py-2.5 transition-colors hover:bg-brand-soft"
    >
      <div>
        <p className="text-sm text-ink">{label}</p>
        {hint && <p className={`text-xs ${hintColor}`}>{hint}</p>}
      </div>
      <span className="text-xl font-semibold text-ink">{value}</span>
    </Link>
  );
}
