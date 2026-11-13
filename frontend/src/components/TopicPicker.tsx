"use client";

import { useMemo, useState } from "react";
import { paperLabel } from "@/lib/format";
import type { TopicRef } from "@/types/syllabus";

export interface FlatTopic extends TopicRef {
  paperCode: string;
  areaName: string;
}

export function TopicPicker({
  flatTopics,
  selected,
  onChange,
  multiple = true,
}: {
  flatTopics: FlatTopic[];
  selected: FlatTopic[];
  onChange: (next: FlatTopic[]) => void;
  multiple?: boolean;
}) {
  const [query, setQuery] = useState("");
  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return flatTopics
      .filter((t) => !selected.some((s) => s.id === t.id))
      .filter((t) => t.name.toLowerCase().includes(q))
      .slice(0, 8);
  }, [query, flatTopics, selected]);

  function pick(t: FlatTopic) {
    onChange(multiple ? [...selected, t] : [t]);
    setQuery("");
  }

  return (
    <div>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search topics…"
        className="w-full rounded-sm border border-rule bg-paper px-2 py-1.5 text-sm text-ink"
      />
      {matches.length > 0 && (
        <ul className="mt-1 max-h-40 overflow-y-auto rounded-sm border border-rule bg-paper-raised">
          {matches.map((t) => (
            <li key={t.id}>
              <button
                type="button"
                onClick={() => pick(t)}
                className="block w-full px-2 py-1.5 text-left text-xs text-ink hover:bg-brand-soft"
              >
                {t.name} <span className="text-ink-soft">· {paperLabel(t.paperCode)} / {t.areaName}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {selected.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {selected.map((t) => (
            <span
              key={t.id}
              className="flex items-center gap-1 rounded-full border border-rule bg-paper px-2 py-0.5 text-xs text-ink"
            >
              {t.name}
              <button
                type="button"
                onClick={() => onChange(selected.filter((s) => s.id !== t.id))}
                className="text-ink-soft hover:text-status-critical"
                aria-label={`Remove ${t.name}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export function flattenTopics(papers: { code: string; areas: { name: string; topics: TopicRef[] }[] }[]): FlatTopic[] {
  const flat: FlatTopic[] = [];
  papers.forEach((p) =>
    p.areas.forEach((a) =>
      a.topics.forEach((t) => flat.push({ id: t.id, name: t.name, paperCode: p.code, areaName: a.name }))
    )
  );
  return flat;
}
