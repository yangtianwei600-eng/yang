import type {
  User,
  Course,
  LessonDetail,
  ProgressOverview,
  ReviewItem,
  RunResult,
  JudgeResult,
  ScriptSummary,
  ScriptDetail,
} from "@/types/api";

// 同源部署（后端托管前端），用相对路径，会话 Cookie 自动带上
export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

async function req<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!res.ok) {
    let detail = `请求失败 (${res.status})`;
    try {
      const data = await res.json();
      if (data?.detail) detail = data.detail;
    } catch {
      // 忽略解析失败
    }
    throw new ApiError(res.status, detail);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  // 认证
  me: () => req<User>("/api/auth/me"),
  logout: () => req<{ ok: boolean }>("/api/auth/logout", { method: "POST" }),

  // 内容
  courses: () => req<Course[]>("/api/courses"),
  lesson: (id: number) => req<LessonDetail>(`/api/lessons/${id}`),

  // 进度
  progress: () => req<ProgressOverview>("/api/progress"),
  completeLesson: (id: number) =>
    req<{ ok: boolean; status: string }>(`/api/progress/lessons/${id}/complete`, {
      method: "POST",
    }),
  attempt: (exerciseId: number, body: { code: string; passed: boolean }) =>
    req<{ ok: boolean; passed: boolean }>(
      `/api/progress/exercises/${exerciseId}/attempt`,
      { method: "POST", body: JSON.stringify(body) }
    ),

  // 复习（SM-2）
  dueReviews: () => req<ReviewItem[]>("/api/review/due"),
  submitReview: (itemId: number, quality: number) =>
    req<{ ok: boolean; next_due: string; interval_days: number }>(
      `/api/review/${itemId}`,
      { method: "POST", body: JSON.stringify({ quality }) }
    ),

  // 代码执行（Docker 沙箱）
  runCode: (code: string) =>
    req<RunResult>("/api/run", {
      method: "POST",
      body: JSON.stringify({ code }),
    }),
  judgeExercise: (exerciseId: number, code: string) =>
    req<JudgeResult>(`/api/run/exercises/${exerciseId}`, {
      method: "POST",
      body: JSON.stringify({ code }),
    }),

  // 脚本管理（满血工作台）
  listScripts: () => req<ScriptSummary[]>("/api/scripts"),
  createScript: (title: string, code: string) =>
    req<ScriptDetail>("/api/scripts", {
      method: "POST",
      body: JSON.stringify({ title, code }),
    }),
  getScript: (id: number) => req<ScriptDetail>(`/api/scripts/${id}`),
  updateScript: (id: number, data: { title?: string; code?: string }) =>
    req<ScriptDetail>(`/api/scripts/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  deleteScript: (id: number) =>
    req<{ ok: boolean }>(`/api/scripts/${id}`, { method: "DELETE" }),
};

// 谷歌登录是整页跳转（OAuth），不能用 fetch
export const LOGIN_URL = "/api/auth/login";
