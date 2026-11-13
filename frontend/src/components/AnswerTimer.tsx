"use client";

import { useEffect, useState } from "react";

/** UPSC Mains norms: 10 marks ≈ 150 words in ~7 min, 15 marks ≈ 250 words in ~11 min. */
export function answerNorms(marks: number | null | undefined, timeLimitMinutes?: number | null) {
  let words: number | null = null;
  let minutes: number | null = null;
  if (marks) {
    if (marks <= 10) [words, minutes] = [150, 7];
    else if (marks <= 15) [words, minutes] = [250, 11];
    else if (marks <= 20) [words, minutes] = [300, 14];
    else [words, minutes] = [1100, 90]; // essay
  }
  if (timeLimitMinutes) minutes = timeLimitMinutes;
  return { words, minutes };
}

export function countWords(text: string): number {
  const trimmed = text.trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
}

function mmss(totalSeconds: number) {
  const s = Math.abs(totalSeconds);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

/**
 * Exam-style practice bar shown above the answer box: a countdown for the
 * question's time budget and a live word count against the UPSC word limit.
 */
export function AnswerTimer({
  text,
  marks,
  timeLimitMinutes,
}: {
  text: string;
  marks: number | null | undefined;
  timeLimitMinutes?: number | null;
}) {
  const { words: wordLimit, minutes } = answerNorms(marks, timeLimitMinutes);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (startedAt === null) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [startedAt]);

  const words = countWords(text);
  const elapsed = startedAt === null ? 0 : Math.floor((now - startedAt) / 1000);
  const budget = minutes ? minutes * 60 : null;
  const remaining = budget !== null ? budget - elapsed : null;
  const overTime = remaining !== null && remaining < 0;
  const overWords = wordLimit !== null && words > wordLimit * 1.1;

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-sm border border-rule bg-paper px-3 py-2 text-xs">
      <span className={overWords ? "font-medium text-status-critical" : "text-ink-soft"}>
        <span className="font-data text-sm font-semibold text-ink">{words}</span>
        {wordLimit ? ` / ${wordLimit} words` : " words"}
      </span>

      {startedAt === null ? (
        <button
          type="button"
          onClick={() => {
            setStartedAt(Date.now());
            setNow(Date.now());
          }}
          className="rounded-sm bg-brand px-2.5 py-1 font-medium text-paper hover:opacity-90"
        >
          ▶ Start {minutes ? `${minutes}-min ` : ""}timer
        </button>
      ) : (
        <>
          <span className={overTime ? "font-medium text-status-critical" : "text-ink-soft"}>
            <span className={`font-data text-sm font-semibold ${overTime ? "" : "text-ink"}`}>
              {remaining !== null ? (overTime ? `+${mmss(remaining)}` : mmss(remaining)) : mmss(elapsed)}
            </span>{" "}
            {remaining !== null ? (overTime ? "over time" : "left") : "elapsed"}
          </span>
          <button
            type="button"
            onClick={() => setStartedAt(null)}
            className="text-ink-soft hover:text-ink hover:underline"
          >
            Reset
          </button>
        </>
      )}

      {wordLimit && minutes && (
        <span className="ml-auto hidden text-ink-soft sm:inline">
          UPSC norm: ~{wordLimit} words in {minutes} min
        </span>
      )}
    </div>
  );
}
