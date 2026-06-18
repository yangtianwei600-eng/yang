import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import type { Course, ProgressOverview } from "@/types/api";
import { BookOpen, ChevronRight, CheckCircle2, Circle } from "lucide-react";

interface LearnViewProps {
  onOpenLesson: (lessonId: number) => void;
  completedLessonIds: Set<number>;
}

export function LearnView({ onOpenLesson, completedLessonIds }: LearnViewProps) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [progress, setProgress] = useState<ProgressOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([api.courses(), api.progress().catch(() => null)])
      .then(([c, p]) => {
        setCourses(c);
        setProgress(p);
      })
      .catch((e: ApiError) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <ViewLoading />;
  if (error) return <ViewError message={error} />;

  const courseProgressMap = new Map(
    (progress?.courses ?? []).map((c) => [c.course_id, c])
  );

  return (
    <div className="mx-auto max-w-3xl px-5 py-6 tablet:px-8">
      <h1 className="mb-1 text-display">学习</h1>
      <p className="mb-7 text-body text-text-secondary">
        按接单价值排序的路线，从能最快变现的开始。
      </p>

      <div className="space-y-5">
        {courses.map((course) => {
          const cp = courseProgressMap.get(course.id);
          const done = cp?.completed_lessons ?? 0;
          const total = cp?.total_lessons ?? course.lessons.length;
          const pct = total > 0 ? Math.round((done / total) * 100) : 0;

          return (
            <div
              key={course.id}
              className="glass overflow-hidden rounded-panel"
            >
              <div className="px-5 pt-5">
                <div className="mb-1 flex items-center gap-2">
                  <BookOpen size={16} className="text-accent" />
                  <h2 className="text-section">{course.title}</h2>
                </div>
                <p className="mb-3 text-body text-text-secondary">
                  {course.description}
                </p>
                {/* 进度条 */}
                <div className="mb-1 flex items-center justify-between text-label">
                  <span className="text-text-tertiary">
                    {done} / {total} 节完成
                  </span>
                  <span className="tnum text-text-secondary">{pct}%</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                  <div
                    className="h-full rounded-full bg-accent transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>

              {/* 章节列表 */}
              <div className="mt-4 border-t border-glass">
                {course.lessons.map((lesson) => {
                  const isDone = completedLessonIds.has(lesson.id);
                  return (
                    <button
                      key={lesson.id}
                      onClick={() => onOpenLesson(lesson.id)}
                      className="flex w-full items-center gap-3 px-5 py-3 text-left transition-colors hover:bg-white/[0.03]"
                    >
                      {isDone ? (
                        <CheckCircle2 size={17} className="shrink-0 text-status-pass" />
                      ) : (
                        <Circle size={17} className="shrink-0 text-text-tertiary" />
                      )}
                      <span
                        className={
                          "flex-1 text-body " +
                          (isDone ? "text-text-secondary" : "text-text-primary")
                        }
                      >
                        {lesson.title}
                      </span>
                      <ChevronRight size={16} className="shrink-0 text-text-tertiary" />
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function ViewLoading() {
  return (
    <div className="flex h-full items-center justify-center py-20">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/15 border-t-accent" />
    </div>
  );
}

export function ViewError({ message }: { message: string }) {
  return (
    <div className="mx-auto max-w-md px-6 py-20 text-center">
      <p className="mb-1 text-body text-status-fail">加载失败</p>
      <p className="text-label text-text-tertiary">{message}</p>
    </div>
  );
}
