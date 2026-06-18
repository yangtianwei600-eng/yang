import { Code2, BookOpen, RotateCcw, BarChart3, Flame, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Section, User } from "@/types/api";

const NAV: { id: Section; label: string; icon: typeof BookOpen }[] = [
  { id: "code", label: "代码", icon: Code2 },
  { id: "learn", label: "学习", icon: BookOpen },
  { id: "review", label: "复习", icon: RotateCcw },
  { id: "progress", label: "进度", icon: BarChart3 },
];

interface SidebarProps {
  active: Section;
  onSelect: (s: Section) => void;
  user: User;
  streak: number;
  onLogout: () => void;
}

// 侧边栏内容（桌面常驻 / 手机抽屉共用）
function SidebarBody({ active, onSelect, user, streak, onLogout }: SidebarProps) {
  return (
    <>
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 py-5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-control bg-accent/15 text-accent">
          <span className="font-mono text-base font-semibold">Py</span>
        </div>
        <span className="text-section">学练</span>
      </div>

      {/* 导航 */}
      <div className="flex flex-1 flex-col gap-1 px-3">
        {NAV.map(({ id, label, icon: Icon }) => {
          const isActive = active === id;
          return (
            <button
              key={id}
              onClick={() => onSelect(id)}
              className={cn(
                "group flex items-center gap-3 rounded-control px-3 py-2.5 text-body transition-colors",
                isActive
                  ? "bg-white/[0.08] text-text-primary"
                  : "text-text-secondary hover:bg-white/[0.04] hover:text-text-primary"
              )}
            >
              <Icon
                size={18}
                className={cn(
                  isActive ? "text-accent" : "text-text-tertiary group-hover:text-text-secondary"
                )}
              />
              <span>{label}</span>
            </button>
          );
        })}
      </div>

      {/* 底部：连续打卡 + 用户 */}
      <div className="border-t border-glass px-3 py-4">
        <div className="mb-3 flex items-center justify-between rounded-card bg-white/[0.03] px-3 py-2.5">
          <div className="flex items-center gap-2 text-text-secondary">
            <Flame size={16} className="text-status-warn" />
            <span className="text-label">连续</span>
          </div>
          <span className="tnum text-badge text-text-primary">{streak} 天</span>
        </div>
        <div className="flex items-center gap-2.5">
          {user.picture ? (
            <img
              src={user.picture}
              alt=""
              className="h-8 w-8 shrink-0 rounded-full"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-text-secondary">
              {(user.name || "U")[0]}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="truncate text-label text-text-primary">
              {user.name || user.email}
            </div>
          </div>
          <button
            onClick={onLogout}
            title="退出登录"
            className="shrink-0 text-text-tertiary transition-colors hover:text-text-primary"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </>
  );
}

// 桌面 / 平板：常驻侧边栏
export function Sidebar(props: SidebarProps) {
  return (
    <nav className="flex h-full w-[220px] flex-col rounded-panel border border-glass bg-bg-sidebar">
      <SidebarBody {...props} />
    </nav>
  );
}

// 手机：左滑抽屉（点外面收起；选中后自动收起）
export function SidebarDrawer({
  onClose,
  onSelect,
  ...rest
}: SidebarProps & { onClose: () => void }) {
  const handleSelect = (s: Section) => {
    onSelect(s);
    onClose();
  };
  return (
    <div className="fixed inset-0 z-40 flex">
      <nav className="glass-warm flex h-full w-[80%] max-w-[300px] flex-col">
        <SidebarBody {...rest} onSelect={handleSelect} />
      </nav>
      <div className="h-full flex-1 bg-black/50" onClick={onClose} />
    </div>
  );
}
