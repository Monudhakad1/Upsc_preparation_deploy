import type { TopicStatus } from "@/types/syllabus";

const STATUS_COLOR: Record<TopicStatus, string> = {
  NOT_STARTED: "bg-status-notstarted",
  IN_PROGRESS: "bg-status-progress",
  COMPLETED: "bg-status-completed",
};

const STATUS_LABEL: Record<TopicStatus, string> = {
  NOT_STARTED: "Not started",
  IN_PROGRESS: "In progress",
  COMPLETED: "Completed",
};

export function StatusDot({ status }: { status: TopicStatus }) {
  return (
    <span
      className={`h-2 w-2 shrink-0 rounded-full ${STATUS_COLOR[status]}`}
      title={STATUS_LABEL[status]}
      aria-label={STATUS_LABEL[status]}
    />
  );
}

export { STATUS_LABEL };
