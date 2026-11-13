/**
 * Upcoming UPSC CSE milestones, from the UPSC annual calendar (2027 calendar
 * released May 2026). UPSC occasionally revises dates - update here if it does.
 * Past dates are skipped automatically, so add the next cycle's dates when
 * they are announced.
 */
export const EXAM_MILESTONES: { label: string; date: string }[] = [
  { label: "CSE Prelims 2027", date: "2027-05-23" },
  { label: "CSE Mains 2027", date: "2027-08-20" },
];

export function daysUntil(isoDate: string): number {
  const target = new Date(`${isoDate}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}

export function upcomingMilestones() {
  return EXAM_MILESTONES.map((m) => ({ ...m, days: daysUntil(m.date) })).filter((m) => m.days >= 0);
}
