import type { ReactNode } from "react";
import { BookOpen, Play, Square, Lightbulb, Terminal, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RunState } from "@/types/run";

export type MobileDrawer = "nav" | "assistant" | "console" | null;

interface MobileTabBarProps {
  runState: RunState;
  onRun: () => void;
  onStop: () => void;
  onOpenDrawer: (d: MobileDrawer) => void;
  activeDrawer: MobileDrawer;
}

export function MobileTabBar({
  runState,
  onRun,
  onStop,
  onOpenDrawer,
  activeDrawer,
}: MobileTabBarProps) {
  const isRunning = runState === "running";

  return (
    <div className="glass flex items-center justify-around rounded-panel px-2 py-2">
      <TabButton
        icon={BookOpen}
        label="学习"
        active={activeDrawer === "nav"}
        onClick={() => onOpenDrawer(activeDrawer === "nav" ? null : "nav")}
      />
      <TabButton
        icon={Lightbulb}
        label="助手"
        active={activeDrawer === "assistant"}
        onClick={() => onOpenDrawer(activeDrawer === "assistant" ? null : "assistant")}
      />

      {/* 运行按钮：居中放大，最高频操作 */}
      <button
        onClick={isRunning ? onStop : onRun}
        className={cn(
          "flex h-14 w-14 shrink-0 items-center justify-center rounded-full transition-colors",
          isRunning ? "bg-white/[0.1] text-text-primary" : "bg-accent text-white"
        )}
      >
        {isRunning ? (
          <Square size={20} className="fill-current" />
        ) : (
          <Play size={22} className="fill-current" />
        )}
      </button>

      <TabButton
        icon={Terminal}
        label="控制台"
        active={activeDrawer === "console"}
        onClick={() => onOpenDrawer(activeDrawer === "console" ? null : "console")}
      />
      {/* 占位保持对称（运行按钮挤掉一格） */}
      <div className="w-12" />
    </div>
  );
}

function TabButton({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: typeof BookOpen;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-12 flex-col items-center gap-0.5 py-1 transition-colors",
        active ? "text-accent" : "text-text-tertiary"
      )}
    >
      <Icon size={20} />
      <span className="text-[10px] leading-none">{label}</span>
    </button>
  );
}

// 底部抽屉容器：从底部升起覆盖编辑器，下滑/点遮罩收回
export function MobileDrawerSheet({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <>
      {/* 遮罩 */}
      <div
        onClick={onClose}
        className={cn(
          "fixed inset-0 z-40 bg-black/40 transition-opacity duration-300",
          open ? "opacity-100" : "pointer-events-none opacity-0"
        )}
      />
      {/* 抽屉：transform 位移，不改 top/left */}
      <div
        className={cn(
          "fixed inset-x-0 bottom-0 z-50 h-[78vh] transition-transform duration-300 ease-out will-change-transform",
          open ? "translate-y-0" : "translate-y-full"
        )}
      >
        <div className="glass flex h-full flex-col rounded-t-panel">
          {/* 抓手 */}
          <div className="flex items-center justify-between px-4 pt-3">
            <div className="mx-auto h-1 w-9 rounded-full bg-white/20" />
            <button onClick={onClose} className="absolute right-4 text-text-tertiary">
              <X size={18} />
            </button>
          </div>
          <div className="flex-1 overflow-hidden p-3">{children}</div>
        </div>
      </div>
    </>
  );
}
