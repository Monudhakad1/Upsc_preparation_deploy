export interface Subtopic {
  id: string;
  name: string;
  displayOrder: number;
}

export interface Topic {
  id: string;
  name: string;
  displayOrder: number;
  subtopics: Subtopic[];
}

export interface Area {
  id: string;
  name: string;
  displayOrder: number;
  topics: Topic[];
}

export type ExamStage = "PRELIMS" | "MAINS" | "OPTIONAL" | "ESSAY";

export interface Paper {
  id: string;
  code: string;
  name: string;
  examStage: ExamStage;
  displayOrder: number;
  areas: Area[];
}

export type TopicStatus = "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";

export interface TopicProgressSummary {
  topicId: string;
  status: TopicStatus;
  confidence: number | null;
  revisionCount: number;
  lastRevisionDate: string | null;
}

export interface Revision {
  id: string;
  revisionNumber: number;
  revisionDate: string;
  durationMinutes: number | null;
  confidence: number | null;
  notes: string | null;
  mentorNote: string | null;
  createdAt: string;
}

export interface TopicProgressDetail {
  topicId: string;
  status: TopicStatus;
  confidence: number | null;
  completedAt: string | null;
  revisions: Revision[];
}

// --- Dashboard analytics (Phase 4) ---

export interface RevisionDepth {
  r1Percent: number;
  r2Percent: number;
  r3Percent: number;
  r4Percent: number;
  r5Percent: number;
  averageRevisionCount: number;
}

export interface SubjectProgress {
  paperId: string;
  paperCode: string;
  paperName: string;
  totalTopics: number;
  completedTopics: number;
  coveragePercent: number;
}

export interface DashboardOverview {
  totalTopics: number;
  completedTopics: number;
  syllabusCoveragePercent: number;
  revisionDepth: RevisionDepth;
  subjects: SubjectProgress[];
}

export interface PriorityTopic {
  topicId: string;
  topicName: string;
  areaName: string;
  paperCode: string;
  confidence: number | null;
  revisionCount: number;
  completedAt: string | null;
  lastRevisionDate: string | null;
}

export interface PriorityLists {
  critical: PriorityTopic[];
  high: PriorityTopic[];
  medium: PriorityTopic[];
  wellRevised: PriorityTopic[];
  lowConfidence: PriorityTopic[];
}

export interface PyqCoverage {
  paperId: string;
  paperCode: string;
  paperName: string;
  totalPyqs: number;
  attemptedPyqs: number;
  coveragePercent: number;
}

// --- PYQs (Phase 5) ---

export type AttemptStatus = "NOT_ATTEMPTED" | "ATTEMPTED" | "SKIPPED";

export interface TopicRef {
  id: string;
  name: string;
}

export interface Pyq {
  id: string;
  paperId: string;
  paperCode: string;
  paperName: string;
  year: number;
  question: string;
  marks: number | null;
  attemptStatus: AttemptStatus;
  answerQuality: number | null;
  analysisNotes: string | null;
  modelAnswerReviewed: boolean;
  reattempted: boolean;
  topics: TopicRef[];
  createdAt: string;
  updatedAt: string;
}

// --- Mentor questions & submissions (Phase 6) ---

export type QuestionType =
  | "MAINS_ANSWER"
  | "MCQ"
  | "CSAT_MATHS"
  | "CSAT_REASONING"
  | "ESSAY"
  | "HISTORY_OPTIONAL"
  | "REVISION_TEST";

export type Difficulty = "EASY" | "MEDIUM" | "HARD";
export type QuestionPriority = "LOW" | "MEDIUM" | "HIGH";

export interface SubmissionSummary {
  id: string;
  textAnswer: string | null;
  hasAttachment: boolean;
  fileName: string | null;
  fileContentType: string | null;
  mentorFeedback: string | null;
  reviewedByMentor: boolean;
  submittedAt: string;
}

export interface Question {
  id: string;
  topicId: string | null;
  topicName: string | null;
  paperId: string | null;
  paperCode: string | null;
  question: string;
  type: QuestionType;
  marks: number | null;
  difficulty: Difficulty | null;
  timeLimitMinutes: number | null;
  deadline: string | null;
  instructions: string | null;
  priority: QuestionPriority;
  submission: SubmissionSummary | null;
  createdAt: string;
}

// --- Daily goals (Phase 7) ---

export type GoalCategory =
  | "SYLLABUS"
  | "REVISION"
  | "PYQ"
  | "ANSWER_WRITING"
  | "CSAT_MATHS"
  | "CSAT_REASONING"
  | "CURRENT_AFFAIRS"
  | "OTHER";

export type GoalStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "PARTIALLY_COMPLETED" | "SKIPPED";
export type GoalPriority = "LOW" | "MEDIUM" | "HIGH";

export interface DailyGoal {
  id: string;
  title: string;
  category: GoalCategory;
  goalDate: string;
  priority: GoalPriority;
  description: string | null;
  status: GoalStatus;
  targetCount: number | null;
  completedCount: number;
  completedAt: string | null;
  mentorNote: string | null;
  createdAt: string;
}

export interface GoalStats {
  todayCompleted: number;
  todayTotal: number;
  weekCompleted: number;
  weekTotal: number;
  monthCompleted: number;
  monthTotal: number;
}
