import { Play, Square, ChevronRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RunState } from "@/types/run";

interface TopBarProps {
  course: string;
  lesson: string;
  runState: RunState;
  onRun: () => void;
  onStop: () => void;
}

export function TopBar({ course, lesson, runState, onRun, onStop }: TopBarProps) {
  const isRunning = runState === "running";

  return (
    <div className="flex items-center justify-between gap-3 px-4 py-2.5">
      {/* 面包屑 */}
      <div className="flex min-w-0 items-center gap-1.5 text-label">
        <span className="truncate text-text-tertiary">{course}</span>
        <ChevronRight size={14} className="shrink-0 text-text-tertiary" />
        <span className="truncate text-text-primary">{lesson}</span>
      </div>

      {/* 运行 / 停止 */}
      <button
        onClick={isRunning ? onStop : onRun}
        className={cn(
          "flex h-8 shrink-0 items-center gap-1.5 rounded-control px-3.5 text-label transition-colors",
          isRunning
            ? "bg-white/[0.06] text-text-primary hover:bg-white/[0.1]"
            : "bg-accent text-white hover:bg-accent-hover"
        )}
      >
        {isRunning ? (
          <>
            <Square size={13} className="fill-current" />
            <span>停止</span>
          </>
        ) : (
          <>
            <Play size={13} className="fill-current" />
            <span>运行</span>
          </>
        )}
      </button>
    </div>
  );
}

// 运行中小指示器（控制台标题栏复用）
export function RunningDot() {
  return <Loader2 size={13} className="animate-spin text-status-info" />;
}
