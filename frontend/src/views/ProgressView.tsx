import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { api, ApiError } from "@/lib/api";
import type { ProgressOverview } from "@/types/api";
import { ViewLoading, ViewError } from "./LearnView";
import { Flame, Trophy, BookCheck, RotateCcw } from "lucide-react";

export function ProgressView() {
  const [data, setData] = useState<ProgressOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .progress()
      .then(setData)
      .catch((e: ApiError) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <ViewLoading />;
  if (error || !data) return <ViewError message={error ?? "无数据"} />;

  return (
    <div className="mx-auto max-w-3xl px-5 py-6 tablet:px-8">
      <h1 className="mb-6 text-display">进度</h1>

      {/* 统计卡片 */}
      <div className="mb-6 grid grid-cols-2 gap-3">
        <StatCard
          icon={<Flame size={18} className="text-status-warn" />}
          label="连续打卡"
          value={`${data.current_streak} 天`}
        />
        <StatCard
          icon={<Trophy size={18} className="text-status-warn" />}
          label="最长记录"
          value={`${data.longest_streak} 天`}
        />
        <StatCard
          icon={<BookCheck size={18} className="text-status-pass" />}
          label="完成章节"
          value={`${data.total_completed_lessons}`}
        />
        <StatCard
          icon={<RotateCcw size={18} className="text-status-info" />}
          label="待复习"
          value={`${data.due_review_count}`}
        />
      </div>

      {/* 各课程进度 */}
      <h2 className="mb-3 text-section">课程进度</h2>
      <div className="space-y-3">
        {data.courses.map((c) => {
          const pct =
            c.total_lessons > 0
              ? Math.round((c.completed_lessons / c.total_lessons) * 100)
              : 0;
          return (
            <div key={c.course_id} className="glass rounded-panel p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-body text-text-primary">{c.title}</span>
                <span className="tnum text-label text-text-secondary">
                  {c.completed_lessons}/{c.total_lessons}
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                <div
                  className="h-full rounded-full bg-accent transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="glass rounded-panel p-4">
      <div className="mb-2">{icon}</div>
      <div className="tnum text-display leading-none">{value}</div>
      <div className="mt-1.5 text-label text-text-tertiary">{label}</div>
    </div>
  );
}
