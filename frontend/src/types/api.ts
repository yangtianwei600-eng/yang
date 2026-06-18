// 对应后端 schemas.py 的数据结构

export interface User {
  id: number;
  email: string;
  name: string;
  picture: string;
  current_streak: number;
  longest_streak: number;
}

export interface ExerciseOut {
  id: number;
  title: string;
  prompt: string;
  starter_code: string;
  order: number;
}

export interface LessonSummary {
  id: number;
  slug: string;
  title: string;
  order: number;
}

export interface LessonDetail {
  id: number;
  slug: string;
  title: string;
  content: string;
  order: number;
  exercises: ExerciseOut[];
}

export interface Course {
  id: number;
  slug: string;
  title: string;
  description: string;
  order: number;
  lessons: LessonSummary[];
}

export interface CourseProgress {
  course_id: number;
  title: string;
  total_lessons: number;
  completed_lessons: number;
}

export interface ProgressOverview {
  current_streak: number;
  longest_streak: number;
  total_completed_lessons: number;
  due_review_count: number;
  courses: CourseProgress[];
}

export interface ReviewItem {
  id: number;
  exercise_id: number;
  exercise_title: string;
  interval_days: number;
  repetitions: number;
}

// 代码运行结果
export interface RunResult {
  stdout: string;
  stderr: string;
  exit_code: number;
  timed_out: boolean;
  duration_ms: number;
}

// 练习判题结果
export interface JudgeResult extends RunResult {
  passed: boolean;
  expected_output: string | null;
}

// 保存的脚本
export interface ScriptSummary {
  id: number;
  title: string;
  updated_at: string;
}

export interface ScriptDetail {
  id: number;
  title: string;
  code: string;
  updated_at: string;
}

// 左侧导航 / 底部 tab 的区段（code = 满血工作台，C 位）
export type Section = "code" | "learn" | "review" | "progress";
