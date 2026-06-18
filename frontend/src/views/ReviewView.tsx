import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import type { ReviewItem } from "@/types/api";
import { ViewLoading, ViewError } from "./LearnView";
import { RotateCcw, CheckCircle2 } from "lucide-react";

// 三档回忆质量 → SM-2 quality 值
const RATINGS = [
  { label: "忘记", quality: 1, cls: "bg-status-fail/15 text-status-fail hover:bg-status-fail/25" },
  { label: "一般", quality: 3, cls: "bg-status-warn/15 text-status-warn hover:bg-status-warn/25" },
  { label: "记得", quality: 5, cls: "bg-status-pass/15 text-status-pass hover:bg-status-pass/25" },
];

export function ReviewView() {
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<number | null>(null);

  useEffect(() => {
    api
      .dueReviews()
      .then(setItems)
      .catch((e: ApiError) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const handleRate = async (itemId: number, quality: number) => {
    if (submitting !== null) return;
    setSubmitting(itemId);
    try {
      await api.submitReview(itemId, quality);
      setItems((prev) => prev.filter((it) => it.id !== itemId));
    } catch {
      // 失败保留该项
    } finally {
      setSubmitting(null);
    }
  };

  if (loading) return <ViewLoading />;
  if (error) return <ViewError message={error} />;

  return (
    <div className="mx-auto max-w-3xl px-5 py-6 tablet:px-8">
      <h1 className="mb-1 text-display">复习</h1>
      <p className="mb-7 text-body text-text-secondary">
        按记忆曲线安排，趁还没忘赶紧过一遍。
      </p>

      {items.length === 0 ? (
        <div className="glass flex flex-col items-center rounded-panel px-6 py-14 text-center">
          <CheckCircle2 size={32} className="mb-3 text-status-pass" />
          <p className="text-body text-text-primary">今天没有要复习的内容</p>
          <p className="mt-1 text-label text-text-tertiary">
            完成练习后会自动加入复习计划
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="glass rounded-panel p-4">
              <div className="mb-3 flex items-center gap-2">
                <RotateCcw size={15} className="text-status-info" />
                <span className="text-body text-text-primary">
                  {item.exercise_title}
                </span>
              </div>
              <div className="flex gap-2">
                {RATINGS.map((r) => (
                  <button
                    key={r.quality}
                    onClick={() => handleRate(item.id, r.quality)}
                    disabled={submitting !== null}
                    className={
                      "h-9 flex-1 rounded-control text-label font-medium transition-colors disabled:opacity-50 " +
                      r.cls
                    }
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
