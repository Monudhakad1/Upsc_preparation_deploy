"use client";

import { FormEvent, useEffect, useState } from "react";
import { ListSkeleton } from "@/components/Skeleton";
import { formatDate, paperLabel, todayISO } from "@/lib/format";
import { RequireAuth } from "@/components/RequireAuth";
import { AppShell } from "@/components/AppShell";
import { TopicPicker, flattenTopics, type FlatTopic } from "@/components/TopicPicker";
import { useAuth } from "@/lib/auth-context";
import { syllabusApi, questionApi, ApiError, QuestionPayload } from "@/lib/api";
import type { Paper, Question, QuestionPriority, QuestionType } from "@/types/syllabus";

const TYPE_LABEL: Record<QuestionType, string> = {
  MAINS_ANSWER: "Mains Answer",
  MCQ: "MCQ",
  CSAT_MATHS: "CSAT Maths",
  CSAT_REASONING: "CSAT Reasoning",
  ESSAY: "Essay",
  HISTORY_OPTIONAL: "History Optional",
  REVISION_TEST: "Revision Test",
};

const PRIORITY_COLOR: Record<QuestionPriority, string> = {
  HIGH: "text-status-critical",
  MEDIUM: "text-status-progress",
  LOW: "text-ink-soft",
};

export default function QuestionsPage() {
  return (
    <RequireAuth>
      <AppShell>
        <QuestionsExplorer />
      </AppShell>
    </RequireAuth>
  );
}

function QuestionsExplorer() {
  const { token, user } = useAuth();
  const isMentor = user?.role === "MENTOR";

  const [papers, setPapers] = useState<Paper[]>([]);
  const [flatTopics, setFlatTopics] = useState<FlatTopic[]>([]);
  const [questions, setQuestions] = useState<Question[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showAssignForm, setShowAssignForm] = useState(false);

  useEffect(() => {
    if (!token) return;
    syllabusApi.getTree(token).then((tree) => {
      setPapers(tree);
      setFlatTopics(flattenTopics(tree));
    });
  }, [token]);

  function reload() {
    if (!token) return;
    questionApi
      .list(token)
      .then(setQuestions)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Couldn't load questions."));
  }

  useEffect(reload, [token]);

  const pendingCount = questions?.filter((q) => !q.submission).length ?? 0;
  const today = todayISO();
  const overdue = questions?.filter((q) => !q.submission && q.deadline && q.deadline < today).length ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold text-ink">
            {isMentor ? "Assigned Questions" : "Today's Questions"}
          </h1>
          <p className="mt-1 text-ink-soft">
            {questions
              ? `${questions.length} total · ${pendingCount} pending${overdue > 0 ? ` · ${overdue} overdue` : ""}`
              : "Loading…"}
          </p>
        </div>
        {isMentor && (
          <button
            onClick={() => setShowAssignForm((v) => !v)}
            className="rounded-sm bg-brand px-4 py-2 text-sm font-medium text-paper transition-opacity hover:opacity-90"
          >
            {showAssignForm ? "Cancel" : "+ Assign Question"}
          </button>
        )}
      </div>

      {showAssignForm && (
        <AssignQuestionForm
          papers={papers}
          flatTopics={flatTopics}
          onCreated={() => {
            setShowAssignForm(false);
            reload();
          }}
        />
      )}

      {error && <p className="text-sm text-status-critical">{error}</p>}

      {!questions ? (
        <ListSkeleton />
      ) : questions.length === 0 ? (
        <p className="text-sm text-ink-soft">
          {isMentor ? "No questions assigned yet — assign one above." : "Nothing assigned yet."}
        </p>
      ) : (
        <div className="space-y-3">
          {questions.map((q) => (
            <QuestionCard key={q.id} question={q} isMentor={isMentor} today={today} onChanged={reload} />
          ))}
        </div>
      )}
    </div>
  );
}

function AssignQuestionForm({
  papers,
  flatTopics,
  onCreated,
}: {
  papers: Paper[];
  flatTopics: FlatTopic[];
  onCreated: () => void;
}) {
  const { token } = useAuth();
  const [selectedTopic, setSelectedTopic] = useState<FlatTopic[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!token || busy) return;
    const form = new FormData(e.currentTarget);
    const marksRaw = form.get("marks");
    const timeLimitRaw = form.get("timeLimitMinutes");
    const deadlineRaw = form.get("deadline") as string;
    const paperIdRaw = form.get("paperId") as string;
    const difficultyRaw = form.get("difficulty") as string;

    const payload: QuestionPayload = {
      question: String(form.get("question")).trim(),
      type: form.get("type") as QuestionType,
      marks: marksRaw ? Number(marksRaw) : undefined,
      difficulty: difficultyRaw ? (difficultyRaw as QuestionPayload["difficulty"]) : undefined,
      timeLimitMinutes: timeLimitRaw ? Number(timeLimitRaw) : undefined,
      deadline: deadlineRaw || undefined,
      instructions: (form.get("instructions") as string)?.trim() || undefined,
      priority: form.get("priority") as QuestionPriority,
      topicId: selectedTopic[0]?.id,
      paperId: paperIdRaw || undefined,
    };

    if (!payload.question || !payload.type) {
      setError("Question and type are required.");
      return;
    }

    setBusy(true);
    setError(null);
    try {
      await questionApi.create(payload, token);
      onCreated();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't assign that question.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-sm border border-rule bg-paper-raised p-4">
      <label className="block text-xs text-ink-soft">
        Question
        <textarea
          name="question"
          required
          rows={3}
          className="mt-1 w-full rounded-sm border border-rule bg-paper px-2 py-1.5 text-sm text-ink"
        />
      </label>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <label className="text-xs text-ink-soft">
          Type
          <select name="type" required className="mt-1 w-full rounded-sm border border-rule bg-paper px-2 py-1.5 text-sm text-ink">
            {Object.entries(TYPE_LABEL).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
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
          Difficulty
          <select name="difficulty" defaultValue="" className="mt-1 w-full rounded-sm border border-rule bg-paper px-2 py-1.5 text-sm text-ink">
            <option value="">—</option>
            <option value="EASY">Easy</option>
            <option value="MEDIUM">Medium</option>
            <option value="HARD">Hard</option>
          </select>
        </label>
        <label className="text-xs text-ink-soft">
          Marks
          <input name="marks" type="number" min={0} className="mt-1 w-full rounded-sm border border-rule bg-paper px-2 py-1.5 text-sm text-ink" />
        </label>
        <label className="text-xs text-ink-soft">
          Time limit (min)
          <input name="timeLimitMinutes" type="number" min={0} className="mt-1 w-full rounded-sm border border-rule bg-paper px-2 py-1.5 text-sm text-ink" />
        </label>
        <label className="text-xs text-ink-soft">
          Deadline
          <input name="deadline" type="date" className="mt-1 w-full rounded-sm border border-rule bg-paper px-2 py-1.5 text-sm text-ink" />
        </label>
        <label className="col-span-2 text-xs text-ink-soft">
          Paper (optional, if not tied to a topic)
          <select name="paperId" defaultValue="" className="mt-1 w-full rounded-sm border border-rule bg-paper px-2 py-1.5 text-sm text-ink">
            <option value="">—</option>
            {papers.map((p) => (
              <option key={p.id} value={p.id}>{paperLabel(p.code)}</option>
            ))}
          </select>
        </label>
      </div>

      <div>
        <p className="text-xs text-ink-soft">Link to a syllabus topic (optional)</p>
        <div className="mt-1">
          <TopicPicker flatTopics={flatTopics} selected={selectedTopic} onChange={setSelectedTopic} multiple={false} />
        </div>
      </div>

      <label className="block text-xs text-ink-soft">
        Instructions (optional)
        <textarea name="instructions" rows={2} className="mt-1 w-full rounded-sm border border-rule bg-paper px-2 py-1.5 text-sm text-ink" />
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

function QuestionCard({
  question,
  isMentor,
  today,
  onChanged,
}: {
  question: Question;
  isMentor: boolean;
  today: string;
  onChanged: () => void;
}) {
  const { token } = useAuth();
  const [expanded, setExpanded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [answerText, setAnswerText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [feedback, setFeedback] = useState(question.submission?.mentorFeedback ?? "");
  const [reviewed, setReviewed] = useState(question.submission?.reviewedByMentor ?? false);
  const [attachmentUrl, setAttachmentUrl] = useState<string | null>(null);

  const isOverdue = !question.submission && question.deadline && question.deadline < today;

  async function handleSubmitAnswer() {
    if (!token || busy) return;
    if (!answerText.trim() && !file) {
      setError("Add some text or attach a file before submitting.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await questionApi.submit(question.id, answerText.trim() || undefined, file ?? undefined, token);
      onChanged();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't submit your answer.");
    } finally {
      setBusy(false);
    }
  }

  async function handleSaveFeedback() {
    if (!token || busy) return;
    setBusy(true);
    setError(null);
    try {
      await questionApi.updateFeedback(question.id, feedback, reviewed, token);
      onChanged();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't save feedback.");
    } finally {
      setBusy(false);
    }
  }

  async function handleViewAttachment() {
    if (!token) return;
    try {
      const blob = await questionApi.getAttachmentBlob(question.id, token);
      setAttachmentUrl(URL.createObjectURL(blob));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't load the attachment.");
    }
  }

  async function handleDelete() {
    if (!token || busy) return;
    if (!confirm("Delete this question and its submission? This can't be undone.")) return;
    setBusy(true);
    try {
      await questionApi.remove(question.id, token);
      onChanged();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't delete this question.");
      setBusy(false);
    }
  }

  return (
    <div className="rounded-sm border border-rule bg-paper-raised">
      <button onClick={() => setExpanded((v) => !v)} className="flex w-full flex-col gap-1 px-4 py-3 text-left">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="font-data text-ink-soft">{TYPE_LABEL[question.type]}</span>
          {question.marks && <span className="font-data text-ink-soft">· {question.marks}m</span>}
          <span className={`font-medium ${PRIORITY_COLOR[question.priority]}`}>{question.priority.charAt(0) + question.priority.slice(1).toLowerCase()} priority</span>
          {question.deadline && (
            <span className={isOverdue ? "text-status-critical" : "text-ink-soft"}>
              due {formatDate(question.deadline)}
              {isOverdue ? " (overdue)" : ""}
            </span>
          )}
          <span className={question.submission ? "text-status-completed" : "text-status-notstarted"}>
            {question.submission ? "submitted" : "pending"}
          </span>
          {question.submission?.reviewedByMentor && <span className="text-status-revision">reviewed</span>}
        </div>
        <p className="text-sm text-ink">{question.question}</p>
        {(question.topicName || question.paperCode) && (
          <span className="text-xs text-ink-soft">{question.topicName ?? paperLabel(question.paperCode)}</span>
        )}
      </button>

      {expanded && (
        <div className="space-y-3 border-t border-rule px-4 py-3">
          {question.instructions && (
            <p className="text-xs text-ink-soft">
              <span className="font-medium text-ink">Instructions: </span>
              {question.instructions}
            </p>
          )}

          {/* Aspirant: submit / view own answer */}
          {!isMentor && !question.submission && (
            <div className="space-y-2">
              <textarea
                value={answerText}
                onChange={(e) => setAnswerText(e.target.value)}
                rows={4}
                placeholder="Write your answer…"
                className="w-full rounded-sm border border-rule bg-paper px-2 py-1.5 text-sm text-ink"
              />
              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="text-xs text-ink-soft"
              />
              <button
                onClick={handleSubmitAnswer}
                disabled={busy}
                className="rounded-sm bg-brand px-3 py-1.5 text-xs font-medium text-paper transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {busy ? "Submitting…" : "Submit answer"}
              </button>
            </div>
          )}

          {question.submission && (
            <div className="space-y-2 rounded-sm border border-rule bg-paper p-3">
              {question.submission.textAnswer && (
                <p className="whitespace-pre-wrap text-sm text-ink">{question.submission.textAnswer}</p>
              )}
              {question.submission.hasAttachment && (
                <div>
                  <button onClick={handleViewAttachment} className="text-xs text-brand hover:underline">
                    📎 {question.submission.fileName ?? "attachment"} — view
                  </button>
                  {attachmentUrl && (
                    <a
                      href={attachmentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-2 text-xs text-ink-soft hover:underline"
                    >
                      open in new tab
                    </a>
                  )}
                </div>
              )}
              <p className="font-data text-xs text-ink-soft">
                Submitted {new Date(question.submission.submittedAt).toLocaleString()}
              </p>
              {question.submission.mentorFeedback && !isMentor && (
                <div className="rounded-sm border border-status-revision/30 bg-status-revision/5 p-2 text-xs text-ink">
                  <span className="font-medium text-status-revision">Mentor feedback: </span>
                  {question.submission.mentorFeedback}
                </div>
              )}
            </div>
          )}

          {/* Mentor: leave feedback once submitted */}
          {isMentor && question.submission && (
            <div className="space-y-2">
              <label className="block text-xs text-ink-soft">
                Feedback
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  rows={2}
                  className="mt-1 w-full rounded-sm border border-rule bg-paper px-2 py-1.5 text-sm text-ink"
                />
              </label>
              <label className="flex items-center gap-1.5 text-xs text-ink">
                <input type="checkbox" checked={reviewed} onChange={(e) => setReviewed(e.target.checked)} />
                Reviewed
              </label>
              <button
                onClick={handleSaveFeedback}
                disabled={busy}
                className="rounded-sm bg-brand px-3 py-1.5 text-xs font-medium text-paper transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {busy ? "Saving…" : "Save feedback"}
              </button>
            </div>
          )}

          {error && <p className="text-xs text-status-critical">{error}</p>}

          {isMentor && (
            <button
              onClick={handleDelete}
              disabled={busy}
              className="rounded-sm border border-status-critical/40 px-3 py-1.5 text-xs text-status-critical hover:bg-status-critical/5"
            >
              Delete question
            </button>
          )}
        </div>
      )}
    </div>
  );
}
