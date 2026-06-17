import { useState } from "react";
import { useBreakpoint } from "@/hooks/useMediaQuery";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { EditorPane } from "./EditorPane";
import { AssistantPanel } from "./AssistantPanel";
import { Console } from "./Console";
import { MobileTabBar, MobileDrawerSheet, type MobileDrawer } from "./MobileTabBar";
import { Lightbulb, PanelRightOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import type { OutputLine, RunState, Section } from "@/types/run";

interface AppShellProps {
  runState: RunState;
  lines: OutputLine[];
  durationMs: number | null;
  onRun: () => void;
  onStop: () => void;
}

export function AppShell(props: AppShellProps) {
  const bp = useBreakpoint();
  const [section, setSection] = useState<Section>("learn");

  if (bp === "mobile") return <MobileLayout {...props} section={section} setSection={setSection} />;
  if (bp === "tablet") return <TabletLayout {...props} section={section} setSection={setSection} />;
  return <DesktopLayout {...props} section={section} setSection={setSection} />;
}

type LayoutProps = AppShellProps & {
  section: Section;
  setSection: (s: Section) => void;
};

const COURSE = "爬虫基础";
const LESSON = "用 requests 抓取网页";

// ── 桌面：完整四象限
function DesktopLayout({
  runState,
  lines,
  durationMs,
  onRun,
  onStop,
  section,
  setSection,
}: LayoutProps) {
  return (
    <div className="flex h-screen gap-3 p-3">
      <Sidebar active={section} onSelect={setSection} />

      {/* 中列：顶栏 + 编辑器 + 控制台 */}
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <div className="glass shrink-0 rounded-panel">
          <TopBar course={COURSE} lesson={LESSON} runState={runState} onRun={onRun} onStop={onStop} />
        </div>
        <div className="min-h-0 flex-1 overflow-hidden rounded-panel">
          <EditorPane runState={runState} />
        </div>
        <div className="h-[200px] shrink-0">
          <Console runState={runState} lines={lines} durationMs={durationMs} />
        </div>
      </div>

      {/* 右列：助手 */}
      <div className="w-[340px] shrink-0">
        <AssistantPanel />
      </div>
    </div>
  );
}

// ── iPad竖屏：导航compact + 助手收成图标条/滑出
function TabletLayout({
  runState,
  lines,
  durationMs,
  onRun,
  onStop,
  section,
  setSection,
}: LayoutProps) {
  const [assistantOpen, setAssistantOpen] = useState(false);

  return (
    <div className="relative flex h-screen gap-3 p-3">
      <Sidebar active={section} onSelect={setSection} compact />

      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <div className="glass flex shrink-0 items-center rounded-panel">
          <div className="flex-1">
            <TopBar course={COURSE} lesson={LESSON} runState={runState} onRun={onRun} onStop={onStop} />
          </div>
          {/* 助手开关 */}
          <button
            onClick={() => setAssistantOpen(true)}
            className="mr-3 flex h-8 w-8 items-center justify-center rounded-control text-text-secondary hover:bg-white/[0.06]"
            title="助手"
          >
            <Lightbulb size={16} />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-hidden rounded-panel">
          <EditorPane runState={runState} />
        </div>
        <div className="h-[160px] shrink-0">
          <Console runState={runState} lines={lines} durationMs={durationMs} />
        </div>
      </div>

      {/* 助手右侧滑出层 */}
      <div
        onClick={() => setAssistantOpen(false)}
        className={cn(
          "fixed inset-0 z-40 bg-black/40 transition-opacity duration-300",
          assistantOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
      />
      <div
        className={cn(
          "fixed inset-y-3 right-3 z-50 w-[340px] transition-transform duration-300 ease-out will-change-transform",
          assistantOpen ? "translate-x-0" : "translate-x-[calc(100%+1rem)]"
        )}
      >
        <AssistantPanel />
      </div>
    </div>
  );
}

// ── 手机：编辑器全屏 + 底部 tab + 抽屉
function MobileLayout({
  runState,
  lines,
  durationMs,
  onRun,
  onStop,
  section,
  setSection,
}: LayoutProps) {
  const [drawer, setDrawer] = useState<MobileDrawer>(null);

  return (
    <div className="flex h-screen flex-col gap-2 p-2">
      {/* 顶部：题目 + 进度 */}
      <div className="glass flex shrink-0 items-center justify-between rounded-panel px-4 py-2.5">
        <div className="flex min-w-0 items-center gap-1.5 text-label">
          <span className="truncate text-text-primary">{LESSON}</span>
        </div>
        <PanelRightOpen size={15} className="shrink-0 text-text-tertiary" />
      </div>

      {/* 编辑器全屏 */}
      <div className="min-h-0 flex-1 overflow-hidden rounded-panel">
        <EditorPane runState={runState} />
      </div>

      {/* 底部 tab */}
      <div className="shrink-0">
        <MobileTabBar
          runState={runState}
          onRun={onRun}
          onStop={onStop}
          onOpenDrawer={setDrawer}
          activeDrawer={drawer}
        />
      </div>

      {/* 抽屉 */}
      <MobileDrawerSheet open={drawer !== null} onClose={() => setDrawer(null)}>
        {drawer === "nav" && <Sidebar active={section} onSelect={(s) => { setSection(s); setDrawer(null); }} />}
        {drawer === "assistant" && <AssistantPanel />}
        {drawer === "console" && (
          <Console runState={runState} lines={lines} durationMs={durationMs} />
        )}
      </MobileDrawerSheet>
    </div>
  );
}
