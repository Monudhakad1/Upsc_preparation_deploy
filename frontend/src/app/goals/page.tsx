"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { ListSkeleton } from "@/components/Skeleton";
import { formatDate, todayISO } from "@/lib/format";
import { RequireAuth } from "@/components/RequireAuth";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/lib/auth-context";
import { goalApi, ApiError, GoalPayload } from "@/lib/api";
import type { DailyGoal, GoalCategory, GoalPriority, GoalStatus } from "@/types/syllabus";

const CATEGORY_LABEL: Record<GoalCategory, string> = {
  SYLLABUS: "Syllabus",
  REVISION: "Revision",
  PYQ: "PYQ",
  ANSWER_WRITING: "Answer Writing",
  CSAT_MATHS: "CSAT Maths",
  CSAT_REASONING: "CSAT Reasoning",
  CURRENT_AFFAIRS: "Current Affairs",
  OTHER: "Other",
};

const STATUS_LABEL: Record<GoalStatus, string> = {
  PENDING: "Pending",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
  PARTIALLY_COMPLETED: "Partially Completed",
  SKIPPED: "Skipped",
};

const STATUS_COLOR: Record<GoalStatus, string> = {
  PENDING: "text-status-notstarted",
  IN_PROGRESS: "text-status-progress",
  COMPLETED: "text-status-completed",
  PARTIALLY_COMPLETED: "text-status-revision",
  SKIPPED: "text-status-critical",
};

function todayStr() {
  return todayISO();
}

export default function GoalsPage() {
  return (
    <RequireAuth>
      <AppShell>
        <GoalsExplorer />
      </AppShell>
    </RequireAuth>
  );
}

function GoalsExplorer() {
  const { token, user } = useAuth();
  const isMentor = user?.role === "MENTOR";

  const [goals, setGoals] = useState<DailyGoal[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [dateFilter, setDateFilter] = useState<"today" | "all">("today");

  function reload() {
    if (!token) return;
    goalApi
      .list(token)
      .then(setGoals)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Couldn't load goals."));
  }

  useEffect(reload, [token]);

  const today = todayStr();
  const visibleGoals = useMemo(() => {
    if (!goals) return [];
    return dateFilter === "today" ? goals.filter((g) => g.goalDate === today) : goals;
  }, [goals, dateFilter, today]);

  const todayCompleted = goals?.filter((g) => g.goalDate === today && g.status === "COMPLETED").length ?? 0;
  const todayTotal = goals?.filter((g) => g.goalDate === today).length ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Daily Goals</h1>
          <p className="mt-1 text-ink-soft">
            Today: {todayCompleted}/{todayTotal} completed
          </p>
        </div>
        {isMentor && (
          <button
            onClick={() => setShowAssignForm((v) => !v)}
            className="rounded-sm bg-brand px-4 py-2 text-sm font-medium text-paper transition-opacity hover:opacity-90"
          >
            {showAssignForm ? "Cancel" : "+ Assign Goal"}
          </button>
        )}
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setDateFilter("today")}
          className={
            "rounded-full border px-3 py-1.5 text-sm transition-colors " +
            (dateFilter === "today"
              ? "border-brand bg-brand text-paper"
              : "border-rule text-ink-soft hover:border-brand hover:text-brand")
          }
        >
          Today
        </button>
        <button
          onClick={() => setDateFilter("all")}
          className={
            "rounded-full border px-3 py-1.5 text-sm transition-colors " +
            (dateFilter === "all"
              ? "border-brand bg-brand text-paper"
              : "border-rule text-ink-soft hover:border-brand hover:text-brand")
          }
        >
          All
        </button>
      </div>

      {showAssignForm && (
        <AssignGoalForm
          onCreated={() => {
            setShowAssignForm(false);
            reload();
          }}
        />
      )}

      {error && <p className="text-sm text-status-critical">{error}</p>}

      {!goals ? (
        <ListSkeleton />
      ) : visibleGoals.length === 0 ? (
        <p className="text-sm text-ink-soft">
          {dateFilter === "today" ? "Nothing assigned for today." : "No goals yet."}
        </p>
      ) : (
        <div className="space-y-3">
          {visibleGoals.map((g) => (
            <GoalCard key={g.id} goal={g} isMentor={isMentor} onChanged={reload} />
          ))}
        </div>
      )}
    </div>
  );
}

function AssignGoalForm({ onCreated }: { onCreated: () => void }) {
  const { token } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!token || busy) return;
    const form = new FormData(e.currentTarget);
    const targetRaw = form.get("targetCount");

    const payload: GoalPayload = {
      title: String(form.get("title")).trim(),
      category: form.get("category") as GoalCategory,
      goalDate: String(form.get("goalDate")),
      priority: form.get("priority") as GoalPriority,
      description: (form.get("description") as string)?.trim() || undefined,
      targetCount: targetRaw ? Number(targetRaw) : undefined,
    };

    if (!payload.title || !payload.category || !payload.goalDate) {
      setError("Title, category, and date are required.");
      return;
    }

    setBusy(true);
    setError(null);
    try {
      await goalApi.create(payload, token);
      onCreated();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't assign that goal.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-sm border border-rule bg-paper-raised p-4">
      <label className="block text-xs text-ink-soft">
        Title
        <input
          name="title"
          required
          placeholder="e.g. Percentage - 10 questions, or Revise Fundamental Rights"
          className="mt-1 w-full rounded-sm border border-rule bg-paper px-2 py-1.5 text-sm text-ink"
        />
      </label>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <label className="text-xs text-ink-soft">
          Category
          <select name="category" required className="mt-1 w-full rounded-sm border border-rule bg-paper px-2 py-1.5 text-sm text-ink">
            {Object.entries(CATEGORY_LABEL).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </label>
        <label className="text-xs text-ink-soft">
          Date
          <input name="goalDate" type="date" required defaultValue={todayStr()} className="mt-1 w-full rounded-sm border border-rule bg-paper px-2 py-1.5 text-sm text-ink" />
        </label>
        <label className="text-xs text-ink-soft">
          Priority
          <select name="priority" defaultValue="MEDIUM" className="mt-1 w-full rounded-sm border border-rule bg-paper px-2 py-1.5 text-sm text-ink">
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
          </select>
        </label>
        <label className="text-xs text-ink-soft">
          Target count (optional)
          <input name="targetCount" type="number" min={0} placeholder="e.g. 10" className="mt-1 w-full rounded-sm border border-rule bg-paper px-2 py-1.5 text-sm text-ink" />
        </label>
      </div>

      <label className="block text-xs text-ink-soft">
        Description (optional)
        <textarea name="description" rows={2} className="mt-1 w-full rounded-sm border border-rule bg-paper px-2 py-1.5 text-sm text-ink" />
      </label>

      {error && <p className="text-xs text-status-critical">{error}</p>}

      <button
        type="submit"
        disabled={busy}
        className="rounded-sm bg-brand px-4 py-2 text-sm font-medium text-paper transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {busy ? "Assigning…" : "Assign"}
      </button>
    </form>
  );
}

function GoalCard({
  goal,
  isMentor,
  onChanged,
}: {
  goal: DailyGoal;
  isMentor: boolean;
  onChanged: () => void;
}) {
  const { token } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [completedCount, setCompletedCount] = useState(goal.completedCount);

  async function setStatus(status: GoalStatus) {
    if (!token || busy) return;
    setBusy(true);
    setError(null);
    try {
      await goalApi.updateProgress(goal.id, status, goal.targetCount != null ? completedCount : undefined, token);
      onChanged();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't update this goal.");
    } finally {
      setBusy(false);
    }
  }

  async function saveCount() {
    if (!token || busy) return;
    setBusy(true);
    setError(null);
    try {
      const nextStatus: GoalStatus =
        goal.targetCount != null && completedCount >= goal.targetCount ? "COMPLETED" : "IN_PROGRESS";
      await goalApi.updateProgress(goal.id, nextStatus, completedCount, token);
      onChanged();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't save progress.");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!token || busy) return;
    if (!confirm("Delete this goal?")) return;
    setBusy(true);
    try {
      await goalApi.remove(goal.id, token);
      onChanged();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't delete this goal.");
      setBusy(false);
    }
  }

  return (
    <div className="rounded-sm border border-rule bg-paper-raised p-4">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="font-data text-ink-soft">{CATEGORY_LABEL[goal.category]}</span>
        <span className="text-ink-soft">· {formatDate(goal.goalDate)}</span>
        <span className={`font-medium ${STATUS_COLOR[goal.status]}`}>{STATUS_LABEL[goal.status]}</span>
        {goal.priority === "HIGH" && <span className="text-status-critical">high priority</span>}
      </div>
      <p className="mt-1 text-sm text-ink">{goal.title}</p>
      {goal.description && <p className="mt-1 text-xs text-ink-soft">{goal.description}</p>}

      {goal.targetCount != null && (
        <div className="mt-2 flex items-center gap-2">
          <input
            type="number"
            min={0}
            max={goal.targetCount}
            value={completedCount}
            disabled={isMentor}
            onChange={(e) => setCompletedCount(Number(e.target.value))}
            className="w-16 rounded-sm border border-rule bg-paper px-2 py-1 text-sm text-ink disabled:opacity-60"
          />
          <span className="text-xs text-ink-soft">/ {goal.targetCount}</span>
          {!isMentor && (
            <button
              onClick={saveCount}
              disabled={busy}
              className="rounded-sm border border-rule px-2 py-1 text-xs text-ink hover:border-brand hover:text-brand"
            >
              Save
            </button>
          )}
        </div>
      )}

      {!isMentor && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {(["PENDING", "IN_PROGRESS", "COMPLETED", "PARTIALLY_COMPLETED", "SKIPPED"] as GoalStatus[]).map((s) => (
            <button
              key={s}
              disabled={busy}
              onClick={() => setStatus(s)}
              className={
                "rounded-full border px-2.5 py-1 text-xs transition-colors disabled:cursor-not-allowed " +
                (goal.status === s
                  ? "border-brand bg-brand text-paper"
                  : "border-rule text-ink-soft hover:border-brand hover:text-brand")
              }
            >
              {STATUS_LABEL[s]}
            </button>
          ))}
        </div>
      )}

      {goal.mentorNote && (
        <p className="mt-2 text-xs text-status-revision">
          <span className="font-medium">Mentor note: </span>
          {goal.mentorNote}
        </p>
      )}

      {error && <p className="mt-2 text-xs text-status-critical">{error}</p>}

      {isMentor && (
        <button
          onClick={handleDelete}
          disabled={busy}
          className="mt-2 rounded-sm border border-status-critical/40 px-3 py-1.5 text-xs text-status-critical hover:bg-status-critical/5"
        >
          Delete
        </button>
      )}
    </div>
  );
}
