"use client";

import { useEffect, useMemo, useState } from "react";
import { ListSkeleton } from "@/components/Skeleton";
import { paperLabel } from "@/lib/format";
import { RequireAuth } from "@/components/RequireAuth";
import { AppShell } from "@/components/AppShell";
import { StatusDot } from "@/components/StatusDot";
import { TopicDetailPanel } from "@/components/TopicDetailPanel";
import { useAuth } from "@/lib/auth-context";
import { syllabusApi, ApiError } from "@/lib/api";
import type { Paper, TopicProgressSummary, TopicStatus } from "@/types/syllabus";

const STAGE_LABELS: Record<string, string> = {
  PRELIMS: "Prelims",
  MAINS: "Mains — GS",
  OPTIONAL: "Optional — History",
  ESSAY: "Essay",
};

export default function SyllabusPage() {
  return (
    <RequireAuth>
      <AppShell>
        <SyllabusExplorer />
      </AppShell>
    </RequireAuth>
  );
}

function SyllabusExplorer() {
  const { token, user } = useAuth();
  const canEdit = user?.role === "ASPIRANT";

  const [papers, setPapers] = useState<Paper[] | null>(null);
  const [progress, setProgress] = useState<Map<string, TopicProgressSummary>>(new Map());
  const [error, setError] = useState<string | null>(null);
  const [activePaperId, setActivePaperId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [expandedTopicId, setExpandedTopicId] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    Promise.all([syllabusApi.getTree(token), syllabusApi.getProgressSummary(token)])
      .then(([tree, summaries]) => {
        setPapers(tree);
        if (tree.length > 0) setActivePaperId(tree[0].id);
        setProgress(new Map(summaries.map((s) => [s.topicId, s])));
      })
      .catch((err) =>
        setError(err instanceof ApiError ? err.message : "Couldn't load the syllabus.")
      );
  }, [token]);

  function statusFor(topicId: string): TopicStatus {
    return progress.get(topicId)?.status ?? "NOT_STARTED";
  }

  function handleTopicChanged(
    topicId: string,
    next: { status: TopicStatus; confidence: number | null; revisions: unknown[] }
  ) {
    setProgress((prev) => {
      const copy = new Map(prev);
      copy.set(topicId, {
        topicId,
        status: next.status,
        confidence: next.confidence,
        revisionCount: next.revisions.length,
        lastRevisionDate: null,
      });
      return copy;
    });
  }

  const totalTopics = useMemo(() => {
    if (!papers) return 0;
    return papers.reduce(
      (sum, p) => sum + p.areas.reduce((a, area) => a + area.topics.length, 0),
      0
    );
  }, [papers]);

  const completedCount = useMemo(() => {
    let count = 0;
    progress.forEach((p) => {
      if (p.status === "COMPLETED") count += 1;
    });
    return count;
  }, [progress]);

  const activePaper = papers?.find((p) => p.id === activePaperId) ?? null;

  const filteredAreas = useMemo(() => {
    if (!activePaper) return [];
    const q = query.trim().toLowerCase();
    if (!q) return activePaper.areas;

    return activePaper.areas
      .map((area) => ({
        ...area,
        topics: area.topics.filter(
          (t) =>
            t.name.toLowerCase().includes(q) ||
            t.subtopics.some((s) => s.name.toLowerCase().includes(q))
        ),
      }))
      .filter((area) => area.name.toLowerCase().includes(q) || area.topics.length > 0);
  }, [activePaper, query]);

  if (error) {
    return (
      <div className="rounded-sm border border-status-critical/40 bg-status-critical/5 p-6 text-status-critical">
        {error}
      </div>
    );
  }

  if (!papers) {
    return <ListSkeleton rows={6} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Syllabus</h1>
          <p className="mt-1 text-ink-soft">
            {papers.length} papers · {totalTopics} topics · {completedCount} completed.{" "}
            {canEdit ? "Click a topic to mark progress and log revisions." : "Read-only mentor view."}
          </p>
        </div>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search topics…"
          className="w-full max-w-xs rounded-sm border border-rule bg-paper-raised px-3 py-2 text-sm text-ink outline-none focus-visible:border-brand sm:w-64"
        />
      </div>

      {/* Paper tabs */}
      <div className="flex flex-wrap gap-2 border-b border-rule pb-4">
        {papers.map((paper) => (
          <button
            key={paper.id}
            onClick={() => setActivePaperId(paper.id)}
            className={
              "rounded-full border px-3 py-1.5 text-sm transition-colors " +
              (paper.id === activePaperId
                ? "border-brand bg-brand text-paper"
                : "border-rule text-ink-soft hover:border-brand hover:text-brand")
            }
            title={STAGE_LABELS[paper.examStage]}
          >
            {paperLabel(paper.code)}
          </button>
        ))}
      </div>

      {activePaper && (
        <div>
          <p className="font-data text-xs uppercase tracking-wide text-ink-soft">
            {STAGE_LABELS[activePaper.examStage]}
          </p>
          <h2 className="mt-1 text-lg font-semibold text-ink">
            {activePaper.name}
          </h2>

          <div className="mt-4 space-y-3">
            {filteredAreas.length === 0 && (
              <p className="text-sm text-ink-soft">No topics match &ldquo;{query}&rdquo;.</p>
            )}
            {filteredAreas.map((area) => (
              <details
                key={area.id}
                open={query.trim().length > 0}
                className="group rounded-sm border border-rule bg-paper-raised"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-ink">
                  <span className="font-medium">{area.name}</span>
                  <AreaProgress
                    done={area.topics.filter((t) => statusFor(t.id) === "COMPLETED").length}
                    total={area.topics.length}
                  />
                </summary>
                <ul className="border-t border-rule">
                  {area.topics.map((topic) => {
                    const isExpanded = expandedTopicId === topic.id;
                    return (
                      <li key={topic.id} className="border-b border-rule/60 last:border-b-0">
                        <button
                          onClick={() => setExpandedTopicId(isExpanded ? null : topic.id)}
                          className="flex w-full items-center gap-2 px-4 py-2.5 text-left transition-colors hover:bg-brand-soft"
                        >
                          <StatusDot status={statusFor(topic.id)} />
                          <span className="text-sm text-ink">{topic.name}</span>
                          {progress.get(topic.id)?.revisionCount ? (
                            <span className="font-data text-xs text-status-revision">
                              {progress.get(topic.id)?.revisionCount}×
                            </span>
                          ) : null}
                        </button>

                        {topic.subtopics.length > 0 && !isExpanded && (
                          <ul className="ml-4 mb-2 space-y-1 border-l border-rule pl-3">
                            {topic.subtopics.map((sub) => (
                              <li key={sub.id} className="text-xs text-ink-soft">
                                {sub.name}
                              </li>
                            ))}
                          </ul>
                        )}

                        {isExpanded && (
                          <TopicDetailPanel
                            topicId={topic.id}
                            canEdit={canEdit}
                            onChange={(detail) => handleTopicChanged(topic.id, detail)}
                          />
                        )}
                      </li>
                    );
                  })}
                </ul>
              </details>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function AreaProgress({ done, total }: { done: number; total: number }) {
  const percent = total > 0 ? Math.round((done / total) * 100) : 0;
  return (
    <span className="flex shrink-0 items-center gap-2">
      <span className="hidden h-1.5 w-20 rounded-full bg-rule sm:block">
        <span
          className="block h-1.5 rounded-full bg-status-completed"
          style={{ width: `${percent}%` }}
        />
      </span>
      <span className="font-data text-xs text-ink-soft">
        {done}/{total}
      </span>
    </span>
  );
}
