import { Terminal, CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { RunningDot } from "./TopBar";
import type { OutputLine, RunState } from "@/types/run";

interface ConsoleProps {
  runState: RunState;
  lines: OutputLine[];
  durationMs?: number | null;
}

export function Console({ runState, lines, durationMs }: ConsoleProps) {
  return (
    <section className="glass flex h-full flex-col rounded-panel">
      {/* 标题栏 */}
      <div className="flex items-center justify-between border-b border-glass px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Terminal size={15} className="text-text-tertiary" />
          <span className="text-label text-text-primary">控制台</span>
        </div>
        <StatusBadge runState={runState} durationMs={durationMs} />
      </div>

      {/* 输出区 */}
      <div className="flex-1 overflow-auto px-4 py-3 font-mono text-console">
        {lines.length === 0 && runState === "idle" && (
          <div className="text-text-tertiary">点击「运行」执行代码，输出会显示在这里。</div>
        )}
        {lines.map((line, i) => (
          <div
            key={i}
            className={cn(
              "whitespace-pre-wrap leading-[18px]",
              line.stream === "stderr" ? "text-status-fail" : "text-text-primary"
            )}
          >
            {line.data}
          </div>
        ))}
      </div>
    </section>
  );
}

function StatusBadge({ runState, durationMs }: { runState: RunState; durationMs?: number | null }) {
  if (runState === "running") {
    return (
      <div className="flex items-center gap-1.5 text-badge text-status-info">
        <RunningDot />
        <span>运行中</span>
      </div>
    );
  }
  if (runState === "success") {
    return (
      <div className="flex items-center gap-1.5 text-badge text-status-pass">
        <CheckCircle2 size={13} />
        <span className="tnum">通过{durationMs != null ? ` · ${durationMs}ms` : ""}</span>
      </div>
    );
  }
  if (runState === "error") {
    return (
      <div className="flex items-center gap-1.5 text-badge text-status-fail">
        <XCircle size={13} />
        <span>报错</span>
      </div>
    );
  }
  return null;
}
