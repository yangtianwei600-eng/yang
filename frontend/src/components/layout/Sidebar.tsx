import { BookOpen, RotateCcw, Swords, BarChart3, Flame, User } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Section } from "@/types/run";

interface SidebarProps {
  active: Section;
  onSelect: (s: Section) => void;
  compact?: boolean; // true = 仅图标（iPad竖屏）
}

const NAV: { id: Section; label: string; icon: typeof BookOpen }[] = [
  { id: "learn", label: "学习", icon: BookOpen },
  { id: "review", label: "复习", icon: RotateCcw },
  { id: "challenge", label: "闯关", icon: Swords },
  { id: "progress", label: "进度", icon: BarChart3 },
];

export function Sidebar({ active, onSelect, compact = false }: SidebarProps) {
  return (
    <nav
      className={cn(
        "glass flex h-full flex-col rounded-panel",
        compact ? "w-16 items-center" : "w-[220px]"
      )}
    >
      {/* Logo */}
      <div className={cn("flex items-center gap-2.5 px-4 py-5", compact && "justify-center px-0")}>
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-control bg-accent/15 text-accent">
          <span className="font-mono text-base font-semibold">Py</span>
        </div>
        {!compact && <span className="text-section">小杨PRO</span>}
      </div>

      {/* 导航项 */}
      <div className={cn("flex flex-1 flex-col gap-1", compact ? "px-2" : "px-3")}>
        {NAV.map(({ id, label, icon: Icon }) => {
          const isActive = active === id;
          return (
            <button
              key={id}
              onClick={() => onSelect(id)}
              title={compact ? label : undefined}
              className={cn(
                "group flex items-center gap-3 rounded-control text-body transition-colors",
                compact ? "h-10 w-10 justify-center" : "px-3 py-2.5",
                isActive
                  ? "bg-accent/15 text-text-primary"
                  : "text-text-secondary hover:bg-white/[0.04] hover:text-text-primary"
              )}
            >
              <Icon
                size={18}
                className={cn(isActive ? "text-accent" : "text-text-tertiary group-hover:text-text-secondary")}
              />
              {!compact && <span>{label}</span>}
            </button>
          );
        })}
      </div>

      {/* 底部：连续打卡 + 头像 */}
      <div className={cn("border-t border-glass", compact ? "px-2 py-3" : "px-3 py-4")}>
        {!compact ? (
          <div className="flex items-center justify-between rounded-card bg-white/[0.03] px-3 py-2.5">
            <div className="flex items-center gap-2 text-text-secondary">
              <Flame size={16} className="text-status-warn" />
              <span className="text-label">连续</span>
            </div>
            <span className="tnum text-badge text-text-primary">7 天</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1 text-status-warn" title="连续 7 天">
            <Flame size={16} />
            <span className="tnum text-badge text-text-primary">7</span>
          </div>
        )}
        <div className={cn("mt-3 flex items-center gap-2.5", compact && "justify-center")}>
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-text-secondary">
            <User size={16} />
          </div>
          {!compact && (
            <div className="min-w-0">
              <div className="truncate text-label text-text-primary">Yang</div>
              <div className="truncate text-badge text-text-tertiary">学习者</div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
