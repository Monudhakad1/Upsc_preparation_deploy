import type { AuthUser, LoginApiResponse } from "@/types/auth";
import type {
  AttemptStatus,
  DailyGoal,
  DashboardOverview,
  Difficulty,
  GoalCategory,
  GoalPriority,
  GoalStats,
  GoalStatus,
  Paper,
  PriorityLists,
  Pyq,
  PyqCoverage,
  Question,
  QuestionPriority,
  QuestionType,
  TopicProgressDetail,
  TopicProgressSummary,
  TopicStatus,
} from "@/types/syllabus";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

// Set by AuthProvider: an expired/invalid token on any authed call signs the user out.
let unauthorizedHandler: (() => void) | null = null;
export function setUnauthorizedHandler(handler: (() => void) | null) {
  unauthorizedHandler = handler;
}

async function toApiError(res: Response, authed: boolean): Promise<ApiError> {
  if (res.status === 401 && authed) unauthorizedHandler?.();
  let message = `Request failed (${res.status})`;
  try {
    const body = await res.json();
    if (body?.message) message = body.message;
  } catch {
    // response wasn't JSON - fall back to the generic message above
  }
  return new ApiError(res.status, message);
}

/**
 * Thin fetch wrapper. Every later phase (syllabus, revisions, PYQs, goals, ...)
 * reuses this instead of calling fetch() directly, so auth headers and error
 * handling stay in one place.
 */
async function request<T>(
  path: string,
  options: RequestInit & { token?: string | null } = {}
): Promise<T> {
  const { token, headers, ...rest } = options;

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  });

  if (!res.ok) throw await toApiError(res, !!token);

  // 204 No Content etc.
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

/** For multipart uploads - never force a JSON Content-Type, the browser sets its own boundary. */
async function requestMultipart<T>(
  path: string,
  formData: FormData,
  token: string | null
): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });

  if (!res.ok) throw await toApiError(res, !!token);
  return res.json() as Promise<T>;
}

/** Downloads a binary attachment as a Blob, for rendering/opening in the browser. */
async function requestBlob(path: string, token: string | null): Promise<Blob> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) {
    if (res.status === 401) unauthorizedHandler?.();
    throw new ApiError(res.status, `Couldn't download the file (${res.status})`);
  }
  return res.blob();
}

export const authApi = {
  login: (email: string, password: string) =>
    request<LoginApiResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  me: (token: string) =>
    request<AuthUser>("/api/auth/me", { token }),

  /**
   * Fire-and-forget wake-up call. On Render's free tier the backend sleeps when
   * idle; pinging it as soon as the login page opens means it is (mostly) booted
   * by the time the user has typed their password.
   */
  wakeUp: () => {
    fetch(`${API_BASE_URL}/actuator/health`, { cache: "no-store" }).catch(() => {});
  },
};

// The syllabus tree is static seed data - fetch it once per session and share
// it across the Syllabus, PYQs and Questions pages instead of refetching each time.
let syllabusTreeCache: Promise<Paper[]> | null = null;
export function clearSyllabusCache() {
  syllabusTreeCache = null;
}

export const syllabusApi = {
  getTree: (token: string) => {
    if (!syllabusTreeCache) {
      syllabusTreeCache = request<Paper[]>("/api/syllabus", { token }).catch((err) => {
        syllabusTreeCache = null; // don't cache failures
        throw err;
      });
    }
    return syllabusTreeCache;
  },
  getProgressSummary: (token: string) =>
    request<TopicProgressSummary[]>("/api/syllabus/progress", { token }),
};

export interface AddRevisionPayload {
  revisionDate?: string;
  durationMinutes?: number;
  confidence?: number;
  notes?: string;
}

export const topicProgressApi = {
  getDetail: (topicId: string, token: string) =>
    request<TopicProgressDetail>(`/api/topics/${topicId}/progress`, { token }),

  updateStatus: (topicId: string, status: TopicStatus, token: string) =>
    request<TopicProgressDetail>(`/api/topics/${topicId}/progress/status`, {
      method: "PUT",
      token,
      body: JSON.stringify({ status }),
    }),

  updateConfidence: (topicId: string, confidence: number, token: string) =>
    request<TopicProgressDetail>(`/api/topics/${topicId}/progress/confidence`, {
      method: "PUT",
      token,
      body: JSON.stringify({ confidence }),
    }),

  addRevision: (topicId: string, payload: AddRevisionPayload, token: string) =>
    request<TopicProgressDetail>(`/api/topics/${topicId}/revisions`, {
      method: "POST",
      token,
      body: JSON.stringify(payload),
    }),
};

export const dashboardApi = {
  getOverview: (token: string) => request<DashboardOverview>("/api/dashboard/overview", { token }),
  getPriorities: (token: string) => request<PriorityLists>("/api/dashboard/priorities", { token }),
  getPyqCoverage: (token: string) => request<PyqCoverage[]>("/api/dashboard/pyq-coverage", { token }),
  getGoalStats: (token: string) => request<GoalStats>("/api/dashboard/goal-stats", { token }),
};

export interface PyqPayload {
  paperId: string;
  year: number;
  question: string;
  marks?: number;
  topicIds?: string[];
}

export interface PyqUpdatePayload extends PyqPayload {
  attemptStatus: AttemptStatus;
  answerQuality?: number;
  analysisNotes?: string;
  modelAnswerReviewed: boolean;
  reattempted: boolean;
}

export const pyqApi = {
  list: (token: string, filters?: { paperId?: string; topicId?: string; attemptStatus?: string }) => {
    const params = new URLSearchParams();
    if (filters?.paperId) params.set("paperId", filters.paperId);
    if (filters?.topicId) params.set("topicId", filters.topicId);
    if (filters?.attemptStatus) params.set("attemptStatus", filters.attemptStatus);
    const qs = params.toString();
    return request<Pyq[]>(`/api/pyqs${qs ? `?${qs}` : ""}`, { token });
  },

  create: (payload: PyqPayload, token: string) =>
    request<Pyq>("/api/pyqs", { method: "POST", token, body: JSON.stringify(payload) }),

  update: (id: string, payload: PyqUpdatePayload, token: string) =>
    request<Pyq>(`/api/pyqs/${id}`, { method: "PUT", token, body: JSON.stringify(payload) }),

  remove: (id: string, token: string) =>
    request<void>(`/api/pyqs/${id}`, { method: "DELETE", token }),
};

export interface QuestionPayload {
  topicId?: string;
  paperId?: string;
  question: string;
  type: QuestionType;
  marks?: number;
  difficulty?: Difficulty;
  timeLimitMinutes?: number;
  deadline?: string;
  instructions?: string;
  priority?: QuestionPriority;
}

export const questionApi = {
  list: (token: string) => request<Question[]>("/api/questions", { token }),

  create: (payload: QuestionPayload, token: string) =>
    request<Question>("/api/questions", { method: "POST", token, body: JSON.stringify(payload) }),

  update: (id: string, payload: QuestionPayload, token: string) =>
    request<Question>(`/api/questions/${id}`, { method: "PUT", token, body: JSON.stringify(payload) }),

  remove: (id: string, token: string) =>
    request<void>(`/api/questions/${id}`, { method: "DELETE", token }),

  submit: (id: string, textAnswer: string | undefined, file: File | undefined, token: string) => {
    const form = new FormData();
    if (textAnswer) form.set("textAnswer", textAnswer);
    if (file) form.set("file", file);
    return requestMultipart<Question>(`/api/questions/${id}/submission`, form, token);
  },

  updateFeedback: (id: string, mentorFeedback: string, reviewedByMentor: boolean, token: string) =>
    request<Question>(`/api/questions/${id}/submission/feedback`, {
      method: "PUT",
      token,
      body: JSON.stringify({ mentorFeedback, reviewedByMentor }),
    }),

  getAttachmentBlob: (id: string, token: string) =>
    requestBlob(`/api/questions/${id}/submission/attachment`, token),
};

export interface GoalPayload {
  title: string;
  category: GoalCategory;
  goalDate: string;
  priority?: GoalPriority;
  description?: string;
  targetCount?: number;
  mentorNote?: string;
}

export const goalApi = {
  list: (token: string) => request<DailyGoal[]>("/api/goals", { token }),

  create: (payload: GoalPayload, token: string) =>
    request<DailyGoal>("/api/goals", { method: "POST", token, body: JSON.stringify(payload) }),

  update: (id: string, payload: GoalPayload, token: string) =>
    request<DailyGoal>(`/api/goals/${id}`, { method: "PUT", token, body: JSON.stringify(payload) }),

  updateProgress: (id: string, status: GoalStatus, completedCount: number | undefined, token: string) =>
    request<DailyGoal>(`/api/goals/${id}/progress`, {
      method: "PUT",
      token,
      body: JSON.stringify({ status, completedCount }),
    }),

  remove: (id: string, token: string) =>
    request<void>(`/api/goals/${id}`, { method: "DELETE", token }),
};
