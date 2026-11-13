import type { PriorityLists, PriorityTopic } from "@/types/syllabus";

/**
 * Spaced revision schedule (the 1-3-7-15-30 rule most UPSC toppers follow):
 * R1 one day after finishing a topic, R2 three days after R1, R3 a week after
 * R2, R4 two weeks after that, R5 a month later, then every two months.
 */
const GAP_DAYS = [1, 3, 7, 15, 30];
const LATER_GAP_DAYS = 60;

export function gapAfter(revisionCount: number): number {
  return GAP_DAYS[revisionCount] ?? LATER_GAP_DAYS;
}

export interface DueRevision extends PriorityTopic {
  /** The revision that is due next, e.g. 2 for "R2". */
  nextRevision: number;
  dueDate: string; // YYYY-MM-DD
  /** Negative = overdue by that many days, 0 = due today, positive = due later. */
  daysLeft: number;
}

function toLocalISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parseISODate(iso: string): Date {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** Every completed topic with its next revision date, most urgent first. */
export function revisionSchedule(priorities: PriorityLists, today: string): DueRevision[] {
  const all = [...priorities.critical, ...priorities.high, ...priorities.medium, ...priorities.wellRevised];
  const todayDate = parseISODate(today);
  const result: DueRevision[] = [];

  for (const t of all) {
    // Last time the topic was touched: the latest revision, else the day it was completed.
    const lastISO =
      t.lastRevisionDate ?? (t.completedAt ? toLocalISO(new Date(t.completedAt)) : null);
    if (!lastISO) continue;
    const due = parseISODate(lastISO);
    due.setDate(due.getDate() + gapAfter(t.revisionCount));
    const daysLeft = Math.round((due.getTime() - todayDate.getTime()) / 86_400_000);
    result.push({ ...t, nextRevision: t.revisionCount + 1, dueDate: toLocalISO(due), daysLeft });
  }

  return result.sort((a, b) => a.daysLeft - b.daysLeft || a.topicName.localeCompare(b.topicName));
}
