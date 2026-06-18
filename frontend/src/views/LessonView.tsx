import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import type { LessonDetail } from "@/types/api";
import { Markdown } from "@/components/Markdown";
import { ExerciseCard } from "@/components/ExerciseCard";
import { ViewLoading, ViewError } from "./LearnView";
import { ArrowLeft, Check, CheckCircle2 } from "lucide-react";

interface LessonViewProps {
  lessonId: number;
  isCompleted: boolean;
  onBack: () => void;
  onCompleted: (lessonId: number) => void;
}

export function LessonView({
  lessonId,
  isCompleted,
  onBack,
  onCompleted,
}: LessonViewProps) {
  const [lesson, setLesson] = useState<LessonDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [marking, setMarking] = useState(false);
  const [done, setDone] = useState(isCompleted);

  useEffect(() => {
    setLoading(true);
    api
      .lesson(lessonId)
      .then(setLesson)
      .catch((e: ApiError) => setError(e.message))
      .finally(() => setLoading(false));
  }, [lessonId]);

  const handleComplete = async () => {
    if (done || marking) return;
    setMarking(true);
    try {
      await api.completeLesson(lessonId);
      setDone(true);
      onCompleted(lessonId);
    } catch {
      // 失败时保持未完成
    } finally {
      setMarking(false);
    }
  };

  if (loading) return <ViewLoading />;
  if (error || !lesson) return <ViewError message={error ?? "章节不存在"} />;

  return (
    <div className="mx-auto max-w-3xl px-5 py-5 tablet:px-8">
      <button
        onClick={onBack}
        className="mb-4 flex items-center gap-1.5 text-label text-text-secondary transition-colors hover:text-text-primary"
      >
        <ArrowLeft size={15} />
        <span>返回</span>
      </button>

      {/* 正文 */}
      <article>
        <Markdown content={lesson.content} />
      </article>

      {/* 练习 */}
      {lesson.exercises.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-3 text-section">练习</h2>
          <div className="space-y-4">
            {lesson.exercises.map((ex) => (
              <ExerciseCard key={ex.id} exercise={ex} />
            ))}
          </div>
        </div>
      )}

      {/* 标记完成 */}
      <div className="mt-8">
        <button
          onClick={handleComplete}
          disabled={done || marking}
          className={
            "flex h-11 w-full items-center justify-center gap-2 rounded-control text-body font-medium transition-colors " +
            (done
              ? "bg-status-pass/15 text-status-pass"
              : "bg-accent text-white hover:bg-accent-hover disabled:opacity-60")
          }
        >
          {done ? (
            <>
              <CheckCircle2 size={17} />
              <span>已完成</span>
            </>
          ) : (
            <>
              <Check size={17} />
              <span>{marking ? "保存中…" : "标记完成"}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
