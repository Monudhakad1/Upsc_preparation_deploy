"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { topicProgressApi, ApiError } from "@/lib/api";
import { formatDate, paperLabel, todayISO } from "@/lib/format";
import { revisionSchedule, type DueRevision } from "@/lib/revision";
import type { PriorityLists } from "@/types/syllabus";

/**
 * "Revise today": spaced-repetition queue built from completed topics.
 * The aspirant can log the revision in one click; the mentor sees it read-only.
 */
export function RevisionDuePanel({
  priorities,
  onRevised,
}: {
  priorities: PriorityLists;
  onRevised: () => void;
}) {
  const { token, user } = useAuth();
  const isAspirant = user?.role === "ASPIRANT";
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  const schedule = revisionSchedule(priorities, todayISO());
  if (schedule.length === 0) return null;

  const due = schedule.filter((r) => r.daysLeft <= 0);
  const upcoming = schedule.filter((r) => r.daysLeft > 0 && r.daysLeft <= 7);
  const overdue = due.filter((r) => r.daysLeft < 0).length;
  const visibleDue = showAll ? due : due.slice(0, 6);

  async function markDone(r: DueRevision) {
    if (!token || busyId) return;
    setBusyId(r.topicId);
    setError(null);
    try {
      await topicProgressApi.addRevision(r.topicId, {}, token);
      onRevised();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't log the revision.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-semibold text-ink">Revise today</h2>
        <span className="text-xs text-ink-soft">Spaced revision · 1 → 3 → 7 → 15 → 30 days</span>
      </div>

      <div className="mt-3 rounded-sm border border-rule bg-paper-raised">
        <div className="flex flex-wrap gap-x-6 gap-y-1 border-b border-rule px-4 py-3 text-sm">
          <span>
            <span className="font-semibold text-ink">{due.length}</span>{" "}
            <span className="text-ink-soft">due now</span>
            {overdue > 0 && <span className="text-status-critical"> ({overdue} overdue)</span>}
          </span>
          <span>
            <span className="font-semibold text-ink">{upcoming.length}</span>{" "}
            <span className="text-ink-soft">in the next 7 days</span>
          </span>
        </div>

        {due.length === 0 ? (
          <p className="px-4 py-3 text-sm text-ink-soft">
            Nothing due today - you&rsquo;re on schedule.
            {upcoming[0] && (
              <>
                {" "}
                Next: <span className="text-ink">{upcoming[0].topicName}</span> (R{upcoming[0].nextRevision}) on{" "}
                {formatDate(upcoming[0].dueDate)}.
              </>
            )}
          </p>
        ) : (
          <ul className="divide-y divide-rule">
            {visibleDue.map((r) => (
              <li key={r.topicId} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2.5">
                <span className="rounded-sm bg-brand-soft px-1.5 py-0.5 font-data text-[11px] font-semibold text-ink">
                  R{r.nextRevision}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink">{r.topicName}</p>
                  <p className="truncate text-xs text-ink-soft">
                    {paperLabel(r.paperCode)} · {r.areaName}
                  </p>
                </div>
                <span className={`text-xs ${r.daysLeft < 0 ? "text-status-critical" : "text-status-progress"}`}>
                  {r.daysLeft < 0
                    ? `${-r.daysLeft} day${r.daysLeft === -1 ? "" : "s"} overdue`
                    : "due today"}
                </span>
                {isAspirant && (
                  <button
                    onClick={() => markDone(r)}
                    disabled={busyId !== null}
                    className="rounded-sm border border-rule px-2.5 py-1 text-xs font-medium text-ink hover:bg-brand-soft disabled:opacity-60"
                  >
                    {busyId === r.topicId ? "Saving…" : `Mark R${r.nextRevision} done`}
                  </button>
                )}
              </li>
            ))}
            {due.length > 6 && (
              <li className="px-4 py-2">
                <button onClick={() => setShowAll((v) => !v)} className="text-xs text-ink-soft hover:text-ink hover:underline">
                  {showAll ? "Show less" : `Show all ${due.length}`}
                </button>
              </li>
            )}
          </ul>
        )}
        {error && <p className="border-t border-rule px-4 py-2 text-xs text-status-critical">{error}</p>}
        <p className="border-t border-rule px-4 py-2 text-xs text-ink-soft">
          Want to add notes or confidence?{" "}
          <Link href="/syllabus" className="hover:text-ink hover:underline">
            Log it from the syllabus
          </Link>
          .
        </p>
      </div>
    </section>
  );
}
