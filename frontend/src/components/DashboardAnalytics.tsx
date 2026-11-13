"use client";

import { useEffect, useState } from "react";
import { DashboardSkeleton } from "@/components/Skeleton";
import { paperLabel } from "@/lib/format";
import Link from "next/link";
import { TodayPanel } from "@/components/TodayPanel";
import { RevisionDuePanel } from "@/components/RevisionDuePanel";
import { useAuth } from "@/lib/auth-context";
import { dashboardApi, goalApi, questionApi, ApiError, prefetch } from "@/lib/api";
import type { DashboardOverview, GoalStats, PriorityLists, PriorityTopic, PyqCoverage } from "@/types/syllabus";

export function DashboardAnalytics() {
  const { token } = useAuth();
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [priorities, setPriorities] = useState<PriorityLists | null>(null);
  const [pyqCoverage, setPyqCoverage] = useState<PyqCoverage[] | null>(null);
  const [goalStats, setGoalStats] = useState<GoalStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Bumped after a write (e.g. a revision logged) to refetch everything.
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!token) return;
    // Kick off Today's-plan data in parallel (TodayPanel mounts later and reuses
    // these in-flight requests via the API cache instead of waiting another trip).
    goalApi.list(token).catch(() => {});
    questionApi.list(token).catch(() => {});
    Promise.all([
      dashboardApi.getOverview(token),
      dashboardApi.getPriorities(token),
      dashboardApi.getPyqCoverage(token),
      dashboardApi.getGoalStats(token),
    ])
      .then(([o, p, pc, gs]) => {
        setOverview(o);
        setPriorities(p);
        setPyqCoverage(pc);
        setGoalStats(gs);
        // Dashboard is ready - quietly load the other pages' data so opening
        // Syllabus / Goals / Questions / PYQs next is instant.
        if (reloadKey === 0) prefetch(token);
      })
      .catch((err) =>
        setError(err instanceof ApiError ? err.message : "Couldn't load the dashboard.")
      );
  }, [token, reloadKey]);

  if (error) {
    return (
      <div className="rounded-sm border border-status-critical/40 bg-status-critical/5 p-4 text-sm text-status-critical">
        {error}
      </div>
    );
  }

  if (!overview || !priorities) {
    return <DashboardSkeleton />;
  }
  const hasNoCompletedTopics = overview.completedTopics === 0;

  return (
    <div className="space-y-8">
      <TodayPanel neverRevisedCount={priorities.critical.length} />

      <RevisionDuePanel priorities={priorities} onRevised={() => setReloadKey((k) => k + 1)} />

      {/* Daily goals - today / week / month */}
      {goalStats && (
        <section>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-ink">Goal completion</h2>
            <Link href="/goals" className="text-xs text-ink-soft hover:text-ink hover:underline">
              View all goals →
            </Link>
          </div>
          <div className="mt-3 grid grid-cols-3 divide-x divide-rule rounded-sm border border-rule bg-paper-raised">
            <GoalStatCard label="Today" completed={goalStats.todayCompleted} total={goalStats.todayTotal} />
            <GoalStatCard label="This week" completed={goalStats.weekCompleted} total={goalStats.weekTotal} />
            <GoalStatCard label="This month" completed={goalStats.monthCompleted} total={goalStats.monthTotal} />
          </div>
        </section>
      )}

      {/* Where Do I Stand? */}
      <section>
        <h2 className="text-lg font-semibold text-ink">Where Do I Stand?</h2>
        <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <StatCard
            label="Syllabus Coverage"
            value={`${overview.syllabusCoveragePercent}%`}
            detail={`${overview.completedTopics} of ${overview.totalTopics} topics completed`}
            percent={overview.syllabusCoveragePercent}
          />
          <div className="rounded-sm border border-rule bg-paper-raised p-4">
            <p className="font-data text-xs uppercase tracking-wide text-ink-soft">Revision Depth</p>
            <p className="mt-1 text-xs text-ink-soft">
              Among completed topics — not the same as syllabus coverage.
            </p>
            <div className="mt-3 space-y-1.5">
              <RevisionBar label="R1" percent={overview.revisionDepth.r1Percent} />
              <RevisionBar label="R2" percent={overview.revisionDepth.r2Percent} />
              <RevisionBar label="R3" percent={overview.revisionDepth.r3Percent} />
              <RevisionBar label="R4" percent={overview.revisionDepth.r4Percent} />
              <RevisionBar label="R5" percent={overview.revisionDepth.r5Percent} />
            </div>
          </div>
        </div>

        {/* Subject-wise progress */}
        <div className="mt-4 rounded-sm border border-rule bg-paper-raised p-4">
          <p className="font-data text-xs uppercase tracking-wide text-ink-soft">Subject Progress</p>
          <div className="mt-3 space-y-2.5">
            {overview.subjects.map((s) => (
              <div key={s.paperId}>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-ink">{paperLabel(s.paperCode)}</span>
                  <span className="text-ink-soft">
                    {s.completedTopics}/{s.totalTopics} · {s.coveragePercent}%
                  </span>
                </div>
                <div className="mt-1 h-1.5 w-full rounded-full bg-rule">
                  <div
                    className="h-1.5 rounded-full bg-status-completed"
                    style={{ width: `${s.coveragePercent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
        {/* PYQ coverage by subject */}
        {pyqCoverage && pyqCoverage.length > 0 && (
          <div className="mt-4 rounded-sm border border-rule bg-paper-raised p-4">
            <p className="font-data text-xs uppercase tracking-wide text-ink-soft">PYQ Coverage</p>
            <div className="mt-3 space-y-2.5">
              {pyqCoverage.map((c) => (
                <div key={c.paperId}>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-ink">{paperLabel(c.paperCode)}</span>
                    <span className="text-ink-soft">
                      {c.attemptedPyqs}/{c.totalPyqs} attempted · {c.coveragePercent}%
                    </span>
                  </div>
                  <div className="mt-1 h-1.5 w-full rounded-full bg-rule">
                    <div
                      className="h-1.5 rounded-full bg-status-revision"
                      style={{ width: `${c.coveragePercent}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* What Should I Do Next? */}
      <section>
        <h2 className="text-lg font-semibold text-ink">What Should I Do Next?</h2>

        {hasNoCompletedTopics ? (
          <p className="mt-2 text-sm text-ink-soft">
            No topics completed yet — priorities will appear here once you start marking
            topics complete on the{" "}
            <Link href="/syllabus" className="text-brand hover:underline">
              syllabus page
            </Link>
            .
          </p>
        ) : (
          <div className="mt-3 space-y-4">
            <PriorityGroup
              title="Completed but never revised"
              tone="critical"
              items={priorities.critical}
            />
            <PriorityGroup title="Only revised once" tone="high" items={priorities.high} />
            {priorities.lowConfidence.length > 0 && (
              <PriorityGroup
                title="Low confidence, regardless of revision count"
                tone="high"
                items={priorities.lowConfidence}
              />
            )}
            <PriorityGroup
              title="Moderately revised (2–4×)"
              tone="medium"
              items={priorities.medium}
              collapsible
            />
            <PriorityGroup
              title="Well revised (5×+)"
              tone="good"
              items={priorities.wellRevised}
              collapsible
            />
          </div>
        )}
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  detail,
  percent,
}: {
  label: string;
  value: string;
  detail: string;
  percent: number;
}) {
  return (
    <div className="flex flex-col rounded-sm border border-rule bg-paper-raised p-4">
      <p className="font-data text-xs uppercase tracking-wide text-ink-soft">{label}</p>
      <p className="mt-1 font-display text-4xl font-semibold text-ink">{value}</p>
      <p className="mt-1 text-xs text-ink-soft">{detail}</p>
      <div className="mt-auto pt-6">
        <div className="h-2 w-full rounded-full bg-rule">
          <div
            className="h-2 rounded-full bg-status-completed"
            style={{ width: `${Math.min(percent, 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function GoalStatCard({ label, completed, total }: { label: string; completed: number; total: number }) {
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
  return (
    <div className="p-4">
      <p className="text-xs font-medium text-ink-soft">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-ink">
        {completed}
        <span className="text-base font-normal text-ink-soft">/{total}</span>
      </p>
      <div className="mt-2 h-1.5 w-full rounded-full bg-rule">
        <div className="h-1.5 rounded-full bg-status-completed" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

function RevisionBar({ label, percent }: { label: string; percent: number }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-5 font-data text-ink-soft">{label}</span>
      <div className="h-1.5 flex-1 rounded-full bg-rule">
        <div className="h-1.5 rounded-full bg-status-revision" style={{ width: `${percent}%` }} />
      </div>
      <span className="w-10 text-right font-data text-ink-soft">{percent}%</span>
    </div>
  );
}

const TONE_STYLES: Record<string, { dot: string; badge: string }> = {
  critical: { dot: "bg-status-critical", badge: "text-status-critical" },
  high: { dot: "bg-status-progress", badge: "text-status-progress" },
  medium: { dot: "bg-status-revision", badge: "text-status-revision" },
  good: { dot: "bg-status-completed", badge: "text-status-completed" },
};

function PriorityGroup({
  title,
  tone,
  items,
  collapsible = false,
}: {
  title: string;
  tone: keyof typeof TONE_STYLES;
  items: PriorityTopic[];
  collapsible?: boolean;
}) {
  if (items.length === 0) return null;
  const style = TONE_STYLES[tone];

  const content = (
    <ul
      className={
        "mt-2 divide-y divide-rule overflow-hidden " +
        (collapsible ? "" : "rounded-sm border border-rule bg-paper-raised")
      }
    >
      {items.slice(0, 8).map((item) => (
        <li
          key={item.topicId}
          className="flex flex-wrap items-center gap-x-2 gap-y-0.5 px-3 py-2 text-xs"
        >
          <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${style.dot}`} />
          <span className="font-medium text-ink">{item.topicName}</span>
          <span className="text-ink-soft">
            {paperLabel(item.paperCode)} · {item.areaName}
          </span>
          <span className={`ml-auto font-data ${style.badge}`}>
            {item.revisionCount === 0 ? "Not revised" : `R${item.revisionCount} done`}
            {item.confidence ? ` · confidence ${item.confidence}/5` : ""}
          </span>
        </li>
      ))}
      {items.length > 8 && (
        <li className="px-3 py-2 text-xs text-ink-soft">+ {items.length - 8} more</li>
      )}
    </ul>
  );

  if (collapsible) {
    return (
      <details className="rounded-sm border border-rule bg-paper-raised px-3 py-2">
        <summary className="cursor-pointer list-none text-sm font-medium text-ink">
          {title} <span className="font-data text-xs text-ink-soft">({items.length})</span>
        </summary>
        {content}
      </details>
    );
  }

  return (
    <div>
      <p className="text-sm font-medium text-ink">
        {title} <span className="font-data text-xs text-ink-soft">({items.length})</span>
      </p>
      {content}
    </div>
  );
}
