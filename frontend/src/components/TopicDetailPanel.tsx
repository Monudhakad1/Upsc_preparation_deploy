"use client";

import { FormEvent, useEffect, useState } from "react";
import { formatDate } from "@/lib/format";
import { useAuth } from "@/lib/auth-context";
import { topicProgressApi, ApiError } from "@/lib/api";
import type { TopicProgressDetail, TopicStatus } from "@/types/syllabus";
import { STATUS_LABEL } from "@/components/StatusDot";

const STATUS_OPTIONS: TopicStatus[] = ["NOT_STARTED", "IN_PROGRESS", "COMPLETED"];

export function TopicDetailPanel({
  topicId,
  canEdit,
  onChange,
}: {
  topicId: string;
  /** Mentors get a read-only view - only the aspirant can edit her own progress. */
  canEdit: boolean;
  onChange: (detail: TopicProgressDetail) => void;
}) {
  const { token } = useAuth();
  const [detail, setDetail] = useState<TopicProgressDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showRevisionForm, setShowRevisionForm] = useState(false);

  useEffect(() => {
    if (!token) return;
    topicProgressApi
      .getDetail(topicId, token)
      .then(setDetail)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Couldn't load this topic."));
  }, [topicId, token]);

  async function handleStatusChange(status: TopicStatus) {
    if (!token || !detail || busy) return;
    setBusy(true);
    setError(null);
    try {
      const updated = await topicProgressApi.updateStatus(topicId, status, token);
      setDetail(updated);
      onChange(updated);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't update status.");
    } finally {
      setBusy(false);
    }
  }

  async function handleConfidenceChange(confidence: number) {
    if (!token || !detail || busy) return;
    setBusy(true);
    setError(null);
    try {
      const updated = await topicProgressApi.updateConfidence(topicId, confidence, token);
      setDetail(updated);
      onChange(updated);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't update confidence.");
    } finally {
      setBusy(false);
    }
  }

  async function handleAddRevision(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!token || busy) return;
    const form = new FormData(e.currentTarget);
    const confidenceRaw = form.get("confidence");
    const durationRaw = form.get("durationMinutes");
    const notes = (form.get("notes") as string)?.trim();

    setBusy(true);
    setError(null);
    try {
      const updated = await topicProgressApi.addRevision(
        topicId,
        {
          confidence: confidenceRaw ? Number(confidenceRaw) : undefined,
          durationMinutes: durationRaw ? Number(durationRaw) : undefined,
          notes: notes || undefined,
        },
        token
      );
      setDetail(updated);
      onChange(updated);
      // Closing the form unmounts it, so no reset is needed. (Calling
      // e.currentTarget.reset() here threw - currentTarget is null after an await -
      // which showed an error even though the revision had been saved.)
      setShowRevisionForm(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't add that revision.");
    } finally {
      setBusy(false);
    }
  }

  if (error && !detail) {
    return <p className="px-4 py-3 text-sm text-status-critical">{error}</p>;
  }
  if (!detail) {
    return <p className="px-4 py-3 font-data text-xs text-ink-soft">Loading…</p>;
  }

  const isCompleted = detail.status === "COMPLETED";

  return (
    <div className="space-y-4 bg-paper px-4 py-4">
      {/* Status */}
      <div>
        <p className="font-data text-xs uppercase tracking-wide text-ink-soft">Status</p>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {STATUS_OPTIONS.map((status) => (
            <button
              key={status}
              disabled={!canEdit || busy}
              onClick={() => handleStatusChange(status)}
              className={
                "rounded-full border px-2.5 py-1 text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-60 " +
                (status === detail.status
                  ? "border-brand bg-brand text-paper"
                  : "border-rule text-ink-soft hover:border-brand hover:text-brand")
              }
            >
              {STATUS_LABEL[status]}
            </button>
          ))}
        </div>
      </div>

      {/* Confidence - only meaningful once completed */}
      <div>
        <p className="font-data text-xs uppercase tracking-wide text-ink-soft">
          Confidence{!isCompleted && " (unlocks once completed)"}
        </p>
        <div className="mt-1.5 flex gap-1.5">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              disabled={!canEdit || !isCompleted || busy}
              onClick={() => handleConfidenceChange(n)}
              className={
                "flex h-7 w-7 items-center justify-center rounded-sm border text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-40 " +
                (detail.confidence === n
                  ? "border-brand bg-brand text-paper"
                  : "border-rule text-ink-soft hover:border-brand hover:text-brand")
              }
              title={`${n}/5`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* Revisions */}
      <div>
        <div className="flex items-center justify-between">
          <p className="font-data text-xs uppercase tracking-wide text-ink-soft">
            Revisions ({detail.revisions.length})
          </p>
          {canEdit && isCompleted && (
            <button
              onClick={() => setShowRevisionForm((v) => !v)}
              className="font-data text-xs text-brand hover:underline"
            >
              {showRevisionForm ? "Cancel" : "+ Add revision"}
            </button>
          )}
        </div>

        {!isCompleted && (
          <p className="mt-1.5 text-xs text-ink-soft">
            Mark this topic completed to unlock R1–R5 (and beyond).
          </p>
        )}

        {detail.revisions.length > 0 && (
          <ul className="mt-2 space-y-1.5">
            {detail.revisions.map((rev) => (
              <li
                key={rev.id}
                className="flex items-center justify-between rounded-sm border border-rule bg-paper-raised px-3 py-1.5 text-xs"
              >
                <span className="font-data text-status-revision">R{rev.revisionNumber}</span>
                <span className="text-ink-soft">{formatDate(rev.revisionDate)}</span>
                {rev.confidence && (
                  <span className="text-ink-soft">confidence {rev.confidence}/5</span>
                )}
                {rev.notes && <span className="max-w-[40%] truncate text-ink">{rev.notes}</span>}
              </li>
            ))}
          </ul>
        )}

        {showRevisionForm && (
          <form onSubmit={handleAddRevision} className="mt-2 space-y-2 rounded-sm border border-rule bg-paper-raised p-3">
            <div className="flex gap-2">
              <label className="flex-1 text-xs text-ink-soft">
                Confidence
                <select
                  name="confidence"
                  defaultValue=""
                  className="mt-1 w-full rounded-sm border border-rule bg-paper px-2 py-1.5 text-sm text-ink"
                >
                  <option value="">—</option>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex-1 text-xs text-ink-soft">
                Minutes spent
                <input
                  name="durationMinutes"
                  type="number"
                  min={0}
                  className="mt-1 w-full rounded-sm border border-rule bg-paper px-2 py-1.5 text-sm text-ink"
                />
              </label>
            </div>
            <label className="block text-xs text-ink-soft">
              Notes
              <textarea
                name="notes"
                rows={2}
                className="mt-1 w-full rounded-sm border border-rule bg-paper px-2 py-1.5 text-sm text-ink"
                placeholder="What did you focus on this time?"
              />
            </label>
            <button
              type="submit"
              disabled={busy}
              className="rounded-sm bg-brand px-3 py-1.5 text-xs font-medium text-paper transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {busy ? "Saving…" : `Save R${detail.revisions.length + 1}`}
            </button>
          </form>
        )}
      </div>

      {error && <p className="text-xs text-status-critical">{error}</p>}
    </div>
  );
}
