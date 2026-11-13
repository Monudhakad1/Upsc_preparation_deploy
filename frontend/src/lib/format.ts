/** Paper codes as UPSC aspirants actually say them. */
const PAPER_LABELS: Record<string, string> = {
  PRELIMS_GS: "GS Prelims",
  CSAT: "CSAT",
  GS1: "GS-I",
  GS2: "GS-II",
  GS3: "GS-III",
  GS4: "GS-IV (Ethics)",
  HIST_OPT_1: "History Opt. P-I",
  HIST_OPT_2: "History Opt. P-II",
  ESSAY: "Essay",
};

/** "GS1" -> "GS-I", "HIST_OPT_1" -> "History Opt. P-I"; unknown codes just lose their underscores. */
export function paperLabel(code: string | null | undefined): string {
  if (!code) return "";
  return PAPER_LABELS[code] ?? code.replace(/_/g, " ");
}

const DATE_FMT = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" });

/** "2026-11-13" -> "13 Nov 2026" (Indian day-month-year order). */
export function formatDate(value: string | null | undefined): string {
  if (!value) return "";
  // Date-only strings are parsed as local dates so they never shift a day.
  const date = /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T00:00:00`) : new Date(value);
  return Number.isNaN(date.getTime()) ? value : DATE_FMT.format(date);
}

/** Today's date as YYYY-MM-DD in the user's local timezone (toISOString() would use UTC). */
export function todayISO(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
