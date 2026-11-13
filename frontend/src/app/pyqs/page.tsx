"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { ListSkeleton } from "@/components/Skeleton";
import { paperLabel } from "@/lib/format";
import { RequireAuth } from "@/components/RequireAuth";
import { AppShell } from "@/components/AppShell";
import { TopicPicker, flattenTopics, type FlatTopic } from "@/components/TopicPicker";
import { useAuth } from "@/lib/auth-context";
import { syllabusApi, pyqApi, ApiError, PyqPayload, PyqUpdatePayload } from "@/lib/api";
import type { AttemptStatus, Paper, Pyq } from "@/types/syllabus";

const STATUS_LABEL: Record<AttemptStatus, string> = {
  NOT_ATTEMPTED: "Not attempted",
  ATTEMPTED: "Attempted",
  SKIPPED: "Skipped",
};

const STATUS_COLOR: Record<AttemptStatus, string> = {
  NOT_ATTEMPTED: "text-status-notstarted",
  ATTEMPTED: "text-status-completed",
  SKIPPED: "text-status-critical",
};

export default function PyqsPage() {
  return (
    <RequireAuth>
      <AppShell>
        <PyqExplorer />
      </AppShell>
    </RequireAuth>
  );
}

function PyqExplorer() {
  const { token, user } = useAuth();
  const canEdit = user?.role === "ASPIRANT";

  const [papers, setPapers] = useState<Paper[]>([]);
  const [flatTopics, setFlatTopics] = useState<FlatTopic[]>([]);
  const [pyqs, setPyqs] = useState<Pyq[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [paperFilter, setPaperFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    if (!token) return;
    syllabusApi.getTree(token).then((tree) => {
      setPapers(tree);
      setFlatTopics(flattenTopics(tree));
    });
  }, [token]);

  function reload() {
    if (!token) return;
    pyqApi
      .list(token, {
        paperId: paperFilter || undefined,
        attemptStatus: statusFilter || undefined,
      })
      .then(setPyqs)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Couldn't load PYQs."));
  }

  useEffect(reload, [token, paperFilter, statusFilter]);

  const summary = useMemo(() => {
    if (!pyqs) return null;
    const attempted = pyqs.filter((p) => p.attemptStatus === "ATTEMPTED").length;
    return { total: pyqs.length, attempted };
  }, [pyqs]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold text-ink">PYQs</h1>
          <p className="mt-1 text-ink-soft">
            {summary ? `${summary.total} logged · ${summary.attempted} attempted` : "Loading…"}
          </p>
        </div>
        {canEdit && (
          <button
            onClick={() => setShowAddForm((v) => !v)}
            className="rounded-sm bg-brand px-4 py-2 text-sm font-medium text-paper transition-opacity hover:opacity-90"
          >
            {showAddForm ? "Cancel" : "+ Add PYQ"}
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        <select
          value={paperFilter}
          onChange={(e) => setPaperFilter(e.target.value)}
          className="rounded-sm border border-rule bg-paper-raised px-3 py-1.5 text-sm text-ink"
        >
          <option value="">All papers</option>
          {papers.map((p) => (
            <option key={p.id} value={p.id}>
              {paperLabel(p.code)}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-sm border border-rule bg-paper-raised px-3 py-1.5 text-sm text-ink"
        >
          <option value="">All statuses</option>
          <option value="NOT_ATTEMPTED">Not attempted</option>
          <option value="ATTEMPTED">Attempted</option>
          <option value="SKIPPED">Skipped</option>
        </select>
      </div>

      {showAddForm && (
        <AddPyqForm
          papers={papers}
          flatTopics={flatTopics}
          onCreated={() => {
            setShowAddForm(false);
            reload();
          }}
        />
      )}

      {error && <p className="text-sm text-status-critical">{error}</p>}

      {!pyqs ? (
        <ListSkeleton />
      ) : pyqs.length === 0 ? (
        <p className="text-sm text-ink-soft">
          No PYQs logged yet{canEdit ? " — add your first one above." : "."}
        </p>
      ) : (
        <div className="space-y-3">
          {pyqs.map((pyq) => (
            <PyqCard
              key={pyq.id}
              pyq={pyq}
              canEdit={canEdit}
              onChanged={reload}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function AddPyqForm({
  papers,
  flatTopics,
  onCreated,
}: {
  papers: Paper[];
  flatTopics: FlatTopic[];
  onCreated: () => void;
}) {
  const { token } = useAuth();
  const [selectedTopics, setSelectedTopics] = useState<FlatTopic[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!token || busy) return;
    const form = new FormData(e.currentTarget);
    const marksRaw = form.get("marks");

    const payload: PyqPayload = {
      paperId: String(form.get("paperId")),
      year: Number(form.get("year")),
      question: String(form.get("question")).trim(),
      marks: marksRaw ? Number(marksRaw) : undefined,
      topicIds: selectedTopics.map((t) => t.id),
    };

    if (!payload.paperId || !payload.question || !payload.year) {
      setError("Paper, year, and question are required.");
      return;
    }

    setBusy(true);
    setError(null);
    try {
      await pyqApi.create(payload, token);
      onCreated();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't save that PYQ.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-3 rounded-sm border border-rule bg-paper-raised p-4"
    >
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <label className="text-xs text-ink-soft">
          Paper
          <select
            name="paperId"
            required
            className="mt-1 w-full rounded-sm border border-rule bg-paper px-2 py-1.5 text-sm text-ink"
          >
            <option value="">Select…</option>
            {papers.map((p) => (
              <option key={p.id} value={p.id}>
                {paperLabel(p.code)}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs text-ink-soft">
          Year
          <input
            name="year"
            type="number"
            required
            min={1990}
            max={2100}
            defaultValue={new Date().getFullYear()}
            className="mt-1 w-full rounded-sm border border-rule bg-paper px-2 py-1.5 text-sm text-ink"
          />
        </label>
        <label className="col-span-2 text-xs text-ink-soft sm:col-span-1">
          Marks
          <input
            name="marks"
            type="number"
            min={0}
            className="mt-1 w-full rounded-sm border border-rule bg-paper px-2 py-1.5 text-sm text-ink"
          />
        </label>
      </div>

      <label className="block text-xs text-ink-soft">
        Question
        <textarea
          name="question"
          required
          rows={3}
          className="mt-1 w-full rounded-sm border border-rule bg-paper px-2 py-1.5 text-sm text-ink"
          placeholder="Paste the question here…"
        />
      </label>

      <div>
        <p className="text-xs text-ink-soft">Link to syllabus topics (optional, can add more than one)</p>
        <div className="mt-1">
          <TopicPicker flatTopics={flatTopics} selected={selectedTopics} onChange={setSelectedTopics} />
        </div>
      </div>

      {error && <p className="text-xs text-status-critical">{error}</p>}

      <button
        type="submit"
        disabled={busy}
        className="rounded-sm bg-brand px-4 py-2 text-sm font-medium text-paper transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {busy ? "Saving…" : "Save PYQ"}
      </button>
    </form>
  );
}

function PyqCard({
  pyq,
  canEdit,
  onChanged,
}: {
  pyq: Pyq;
  canEdit: boolean;
  onChanged: () => void;
}) {
  const { token } = useAuth();
  const [expanded, setExpanded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<AttemptStatus>(pyq.attemptStatus);
  const [quality, setQuality] = useState<number | null>(pyq.answerQuality);
  const [notes, setNotes] = useState(pyq.analysisNotes ?? "");
  const [reviewed, setReviewed] = useState(pyq.modelAnswerReviewed);
  const [reattempted, setReattempted] = useState(pyq.reattempted);

  async function handleSave() {
    if (!token || busy) return;
    setBusy(true);
    setError(null);
    const payload: PyqUpdatePayload = {
      paperId: pyq.paperId,
      year: pyq.year,
      question: pyq.question,
      marks: pyq.marks ?? undefined,
      topicIds: pyq.topics.map((t) => t.id),
      attemptStatus: status,
      answerQuality: quality ?? undefined,
      analysisNotes: notes || undefined,
      modelAnswerReviewed: reviewed,
      reattempted,
    };
    try {
      await pyqApi.update(pyq.id, payload, token);
      onChanged();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't save changes.");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!token || busy) return;
    if (!confirm("Delete this PYQ? This can't be undone.")) return;
    setBusy(true);
    try {
      await pyqApi.remove(pyq.id, token);
      onChanged();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't delete this PYQ.");
      setBusy(false);
    }
  }

  return (
    <div className="rounded-sm border border-rule bg-paper-raised">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full flex-col gap-1 px-4 py-3 text-left"
      >
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="font-data text-ink-soft">
            {paperLabel(pyq.paperCode)} · {pyq.year}
            {pyq.marks ? ` · ${pyq.marks}m` : ""}
          </span>
          <span className={`font-medium ${STATUS_COLOR[pyq.attemptStatus]}`}>
            {STATUS_LABEL[pyq.attemptStatus]}
          </span>
          {pyq.reattempted && <span className="text-status-revision">reattempted</span>}
        </div>
        <p className="text-sm text-ink">{pyq.question}</p>
        {pyq.topics.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {pyq.topics.map((t) => (
              <span key={t.id} className="rounded-full border border-rule px-2 py-0.5 text-xs text-ink-soft">
                {t.name}
              </span>
            ))}
          </div>
        )}
      </button>

      {expanded && (
        <div className="space-y-3 border-t border-rule px-4 py-3">
          <div>
            <p className="font-data text-xs uppercase tracking-wide text-ink-soft">Attempt status</p>
            <div className="mt-1.5 flex gap-1.5">
              {(["NOT_ATTEMPTED", "ATTEMPTED", "SKIPPED"] as AttemptStatus[]).map((s) => (
                <button
                  key={s}
                  disabled={!canEdit}
                  onClick={() => setStatus(s)}
                  className={
                    "rounded-full border px-2.5 py-1 text-xs transition-colors disabled:cursor-not-allowed " +
                    (status === s
                      ? "border-brand bg-brand text-paper"
                      : "border-rule text-ink-soft hover:border-brand hover:text-brand")
                  }
                >
                  {STATUS_LABEL[s]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="font-data text-xs uppercase tracking-wide text-ink-soft">Answer quality</p>
            <div className="mt-1.5 flex gap-1.5">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  disabled={!canEdit}
                  onClick={() => setQuality(n)}
                  className={
                    "flex h-7 w-7 items-center justify-center rounded-sm border text-xs disabled:cursor-not-allowed " +
                    (quality === n
                      ? "border-brand bg-brand text-paper"
                      : "border-rule text-ink-soft hover:border-brand hover:text-brand")
                  }
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          <label className="block text-xs text-ink-soft">
            Analysis notes
            <textarea
              value={notes}
              disabled={!canEdit}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="mt-1 w-full rounded-sm border border-rule bg-paper px-2 py-1.5 text-sm text-ink disabled:opacity-60"
            />
          </label>

          <div className="flex flex-wrap gap-4 text-xs text-ink">
            <label className="flex items-center gap-1.5">
              <input
                type="checkbox"
                checked={reviewed}
                disabled={!canEdit}
                onChange={(e) => setReviewed(e.target.checked)}
              />
              Model answer reviewed
            </label>
            <label className="flex items-center gap-1.5">
              <input
                type="checkbox"
                checked={reattempted}
                disabled={!canEdit}
                onChange={(e) => setReattempted(e.target.checked)}
              />
              Reattempted
            </label>
          </div>

          {error && <p className="text-xs text-status-critical">{error}</p>}

          {canEdit && (
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                disabled={busy}
                className="rounded-sm bg-brand px-3 py-1.5 text-xs font-medium text-paper transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {busy ? "Saving…" : "Save"}
              </button>
              <button
                onClick={handleDelete}
                disabled={busy}
                className="rounded-sm border border-status-critical/40 px-3 py-1.5 text-xs text-status-critical hover:bg-status-critical/5"
              >
                Delete
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
