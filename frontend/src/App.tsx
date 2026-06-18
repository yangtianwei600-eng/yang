import { useState, useCallback } from "react";
import { Menu } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useBreakpoint } from "@/hooks/useMediaQuery";
import { LoginScreen } from "@/components/LoginScreen";
import { Sidebar, SidebarDrawer } from "@/components/Sidebar";
import { CodeLab } from "@/components/CodeLab";
import { LearnView } from "@/views/LearnView";
import { LessonView } from "@/views/LessonView";
import { ProgressView } from "@/views/ProgressView";
import { ReviewView } from "@/views/ReviewView";
import type { Section, User } from "@/types/api";

const SECTION_TITLE: Record<Section, string> = {
  code: "代码",
  learn: "学习",
  review: "复习",
  progress: "进度",
};

export default function App() {
  const { user, loading, logout } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg-base">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-white/15 border-t-accent" />
      </div>
    );
  }

  if (!user) return <LoginScreen />;

  return <Shell key={user.id} logout={logout} user={user} />;
}

function Shell({ user, logout }: { user: User; logout: () => void }) {
  const bp = useBreakpoint();
  // 满血工作台是 C 位，默认进入
  const [section, setSection] = useState<Section>("code");
  const [openLessonId, setOpenLessonId] = useState<number | null>(null);
  const [completedLessonIds, setCompletedLessonIds] = useState<Set<number>>(
    new Set()
  );
  const [navOpen, setNavOpen] = useState(false);

  const handleSelectSection = useCallback((s: Section) => {
    setSection(s);
    setOpenLessonId(null);
  }, []);

  const markCompleted = useCallback((lessonId: number) => {
    setCompletedLessonIds((prev) => new Set(prev).add(lessonId));
  }, []);

  const isCodeLab = section === "code";

  // 主内容区
  let main;
  if (section === "code") {
    main = <CodeLab onMenu={() => setNavOpen(true)} />;
  } else if (section === "learn") {
    main =
      openLessonId === null ? (
        <LearnView
          onOpenLesson={setOpenLessonId}
          completedLessonIds={completedLessonIds}
        />
      ) : (
        <LessonView
          lessonId={openLessonId}
          isCompleted={completedLessonIds.has(openLessonId)}
          onBack={() => setOpenLessonId(null)}
          onCompleted={markCompleted}
        />
      );
  } else if (section === "review") {
    main = <ReviewView />;
  } else {
    main = <ProgressView />;
  }

  if (bp === "mobile") {
    return (
      <div className="flex h-full flex-col bg-bg-base">
        {/* 非工作台视图：极简顶栏（汉堡 + 标题）。工作台自带顶栏 */}
        {!isCodeLab && (
          <header className="flex shrink-0 items-center gap-1.5 px-3 py-3">
            <button
              onClick={() => setNavOpen(true)}
              aria-label="菜单"
              className="flex h-9 w-9 items-center justify-center rounded-control text-text-secondary transition-colors hover:bg-white/[0.06] hover:text-text-primary"
            >
              <Menu size={20} />
            </button>
            <span className="text-section">{SECTION_TITLE[section]}</span>
          </header>
        )}

        <div
          className={
            isCodeLab
              ? "min-h-0 flex-1 p-2"
              : "min-h-0 flex-1 overflow-y-auto overscroll-contain"
          }
        >
          {main}
        </div>

        {/* 左滑导航抽屉 */}
        {navOpen && (
          <SidebarDrawer
            active={section}
            onSelect={handleSelectSection}
            user={user}
            streak={user.current_streak}
            onLogout={logout}
            onClose={() => setNavOpen(false)}
          />
        )}
      </div>
    );
  }

  // 桌面 / 平板：左侧常驻导航 + 主内容
  return (
    <div className="flex h-full gap-3 bg-bg-base p-3">
      <Sidebar
        active={section}
        onSelect={handleSelectSection}
        user={user}
        streak={user.current_streak}
        onLogout={logout}
      />
      <div
        className={
          isCodeLab
            ? "min-w-0 flex-1"
            : "min-w-0 flex-1 overflow-y-auto overscroll-contain rounded-panel"
        }
      >
        {main}
      </div>
    </div>
  );
}
