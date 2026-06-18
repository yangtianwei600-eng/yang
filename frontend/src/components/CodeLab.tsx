import { useState, useRef, useEffect, useCallback } from "react";
import type { KeyboardEvent, MouseEvent } from "react";
import { api, ApiError } from "@/lib/api";
import type { RunResult, ScriptSummary } from "@/types/api";
import {
  Play,
  Loader2,
  Save,
  Plus,
  FileCode2,
  Trash2,
  Menu,
  Check,
  Copy,
  Eraser,
  X,
} from "lucide-react";

const DEFAULT_CODE = `# 满血 Python · 想写什么写什么
# 已预装：requests httpx beautifulsoup4 lxml pandas numpy openpyxl sqlalchemy redis openai playwright

print("Hello, 满血 Python")
`;

type RunState = "idle" | "running" | "done" | "error";

export function CodeLab({ onMenu }: { onMenu?: () => void }) {
  const [code, setCode] = useState(DEFAULT_CODE);
  const [runState, setRunState] = useState<RunState>("idle");
  const [result, setResult] = useState<RunResult | null>(null);

  // 当前脚本
  const [scriptId, setScriptId] = useState<number | null>(null);
  const [title, setTitle] = useState("未命名脚本");
  const [dirty, setDirty] = useState(false); // 有未保存改动
  const [saving, setSaving] = useState(false);

  // 脚本列表抽屉
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [scripts, setScripts] = useState<ScriptSummary[]>([]);
  const [editingTitle, setEditingTitle] = useState(false);
  const [copied, setCopied] = useState(false); // 复制代码反馈

  const taRef = useRef<HTMLTextAreaElement>(null);

  const refreshScripts = useCallback(() => {
    api.listScripts().then(setScripts).catch(() => {});
  }, []);

  useEffect(() => {
    refreshScripts();
  }, [refreshScripts]);

  // ── 运行 ──
  const handleRun = async () => {
    setRunState("running");
    setResult(null);
    try {
      const r = await api.runCode(code);
      setResult(r);
      setRunState(r.exit_code === 0 && !r.timed_out ? "done" : "error");
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "运行失败";
      setResult({
        stdout: "",
        stderr: msg,
        exit_code: -1,
        timed_out: false,
        duration_ms: 0,
      });
      setRunState("error");
    }
  };

  // ── 保存 ──
  const handleSave = async () => {
    setSaving(true);
    try {
      if (scriptId === null) {
        const s = await api.createScript(title, code);
        setScriptId(s.id);
      } else {
        await api.updateScript(scriptId, { title, code });
      }
      setDirty(false);
      refreshScripts();
    } catch {
      // 忽略
    } finally {
      setSaving(false);
    }
  };

  // ── 新建 ──
  const handleNew = () => {
    setScriptId(null);
    setTitle("未命名脚本");
    setCode(DEFAULT_CODE);
    setResult(null);
    setRunState("idle");
    setDirty(false);
    setDrawerOpen(false);
  };

  // ── 复制代码 ──
  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      // 忽略
    }
  };

  // ── 清空当前代码 ──
  const handleClear = () => {
    setCode("");
    setDirty(true);
    setResult(null);
    setRunState("idle");
    taRef.current?.focus();
  };

  // ── 打开脚本 ──
  const handleOpen = async (id: number) => {
    try {
      const s = await api.getScript(id);
      setScriptId(s.id);
      setTitle(s.title);
      setCode(s.code);
      setResult(null);
      setRunState("idle");
      setDirty(false);
      setDrawerOpen(false);
    } catch {
      // 忽略
    }
  };

  // ── 删除脚本 ──
  const handleDelete = async (id: number, e: MouseEvent) => {
    e.stopPropagation();
    try {
      await api.deleteScript(id);
      if (id === scriptId) handleNew();
      refreshScripts();
    } catch {
      // 忽略
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const ta = taRef.current;
      if (!ta) return;
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const next = code.slice(0, start) + "    " + code.slice(end);
      setCode(next);
      setDirty(true);
      requestAnimationFrame(() => {
        ta.selectionStart = ta.selectionEnd = start + 4;
      });
    }
  };

  const onCodeChange = (v: string) => {
    setCode(v);
    setDirty(true);
  };

  const frameState =
    runState === "running"
      ? "running"
      : runState === "done"
      ? "success"
      : runState === "error"
      ? "error"
      : "idle";

  return (
    <div className="relative flex h-full flex-col">
      {/* 顶栏 */}
      <header className="flex items-center gap-2 px-3 py-2.5">
        <button
          onClick={onMenu}
          className="flex h-9 w-9 items-center justify-center rounded-control text-text-secondary transition-colors hover:bg-white/[0.06] hover:text-text-primary"
          aria-label="菜单"
        >
          <Menu size={20} />
        </button>

        {/* 标题（可编辑） */}
        <div className="flex min-w-0 flex-1 items-center gap-1.5">
          {editingTitle ? (
            <input
              autoFocus
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setDirty(true);
              }}
              onBlur={() => setEditingTitle(false)}
              onKeyDown={(e) => e.key === "Enter" && setEditingTitle(false)}
              className="min-w-0 flex-1 rounded-control bg-white/[0.06] px-2 py-1 text-body text-text-primary outline-none"
            />
          ) : (
            <button
              onClick={() => setEditingTitle(true)}
              className="flex min-w-0 items-center gap-1.5"
            >
              <span className="truncate text-body text-text-primary">{title}</span>
              {dirty && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />}
            </button>
          )}
        </div>

        {/* 复制代码 */}
        <button
          onClick={handleCopyCode}
          className="flex h-9 w-9 items-center justify-center rounded-control text-text-secondary transition-colors hover:bg-white/[0.06] hover:text-text-primary"
          aria-label="复制代码"
        >
          {copied ? <Check size={18} className="text-status-pass" /> : <Copy size={18} />}
        </button>

        {/* 清空代码 */}
        <button
          onClick={handleClear}
          className="flex h-9 w-9 items-center justify-center rounded-control text-text-secondary transition-colors hover:bg-white/[0.06] hover:text-text-primary"
          aria-label="清空代码"
        >
          <Eraser size={18} />
        </button>

        {/* 脚本列表 */}
        <button
          onClick={() => setDrawerOpen(true)}
          className="flex h-9 w-9 items-center justify-center rounded-control text-text-secondary transition-colors hover:bg-white/[0.06] hover:text-text-primary"
          aria-label="我的脚本"
        >
          <FileCode2 size={18} />
        </button>

        {/* 保存 */}
        <button
          onClick={handleSave}
          disabled={saving || !dirty}
          className="flex h-9 w-9 items-center justify-center rounded-control text-text-secondary transition-colors hover:bg-white/[0.06] hover:text-text-primary disabled:opacity-40"
          aria-label="保存"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={18} />}
        </button>
      </header>

      {/* 编辑器 */}
      <div className="min-h-0 flex-1 px-3">
        <div
          className="editor-frame h-full overflow-hidden rounded-panel border border-white/[0.05]"
          data-runstate={frameState}
        >
          <div className="flex h-full bg-bg-editor">
            <textarea
              ref={taRef}
              value={code}
              onChange={(e) => onCodeChange(e.target.value)}
              onKeyDown={handleKeyDown}
              spellCheck={false}
              autoCapitalize="off"
              autoCorrect="off"
              placeholder="# 在这里写 Python…"
              className="h-full w-full resize-none overscroll-contain border-0 bg-transparent p-4 font-mono text-code leading-6 text-text-primary outline-none placeholder:text-text-tertiary"
              style={{ tabSize: 4 }}
            />
          </div>
        </div>
      </div>

      {/* 运行栏 */}
      <div className="flex items-center gap-3 px-3 py-2.5">
        <button
          onClick={handleRun}
          disabled={runState === "running"}
          className="flex h-11 flex-1 items-center justify-center gap-2 rounded-control bg-accent text-body font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-70"
        >
          {runState === "running" ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              <span>运行中…</span>
            </>
          ) : (
            <>
              <Play size={18} />
              <span>运行</span>
            </>
          )}
        </button>
        {result && result.duration_ms > 0 && (
          <span className="tnum text-label text-text-tertiary">
            {(result.duration_ms / 1000).toFixed(2)}s
          </span>
        )}
      </div>

      {/* 输出台 */}
      {result && runState !== "running" && (
        <OutputPanel result={result} onClose={() => setResult(null)} />
      )}

      {/* 脚本抽屉 */}
      {drawerOpen && (
        <ScriptDrawer
          scripts={scripts}
          currentId={scriptId}
          onClose={() => setDrawerOpen(false)}
          onNew={handleNew}
          onOpen={handleOpen}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}

// ── 输出面板（居中浮窗）──
function OutputPanel({
  result,
  onClose,
}: {
  result: RunResult;
  onClose: () => void;
}) {
  const ok = result.exit_code === 0 && !result.timed_out;
  const [outCopied, setOutCopied] = useState(false);

  const copyOutput = async () => {
    try {
      await navigator.clipboard.writeText((result.stdout || "") + (result.stderr || ""));
      setOutCopied(true);
      setTimeout(() => setOutCopied(false), 1200);
    } catch {
      // 忽略
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-5">
      {/* 遮罩：点击关闭 */}
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      {/* 结果窗口：居中浮窗，固定高度；输出超出在窗内上下滚 */}
      <div className="glass relative flex h-[68%] w-full max-w-[600px] flex-col overflow-hidden rounded-panel">
        <div className="flex items-center justify-between border-b border-glass px-4 py-3">
          <div className="flex min-w-0 items-center gap-2">
            {ok ? (
              <Check size={15} className="shrink-0 text-status-pass" />
            ) : (
              <X size={15} className="shrink-0 text-status-fail" />
            )}
            <span className="text-label text-text-secondary">
              {result.timed_out ? "超时终止" : ok ? "运行完成" : `退出码 ${result.exit_code}`}
            </span>
            {result.duration_ms > 0 && (
              <span className="tnum text-label text-text-tertiary">
                · {(result.duration_ms / 1000).toFixed(2)}s
              </span>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <button
              onClick={copyOutput}
              className="flex h-7 w-7 items-center justify-center rounded-control text-text-tertiary transition-colors hover:bg-white/[0.06] hover:text-text-primary"
              aria-label="复制输出"
            >
              {outCopied ? (
                <Check size={16} className="text-status-pass" />
              ) : (
                <Copy size={16} />
              )}
            </button>
            <button
              onClick={onClose}
              className="flex h-7 w-7 items-center justify-center rounded-control text-text-tertiary transition-colors hover:bg-white/[0.06] hover:text-text-primary"
              aria-label="关闭"
            >
              <X size={17} />
            </button>
          </div>
        </div>
        <pre className="min-h-0 flex-1 overflow-auto overscroll-contain whitespace-pre-wrap break-all px-4 py-3 font-mono text-code leading-5">
          {result.stdout && <span className="text-text-primary">{result.stdout}</span>}
          {result.stderr && <span className="text-status-fail">{result.stderr}</span>}
          {!result.stdout && !result.stderr && (
            <span className="text-text-tertiary">（无输出）</span>
          )}
        </pre>
      </div>
    </div>
  );
}

// ── 脚本抽屉 ──
function ScriptDrawer({
  scripts,
  currentId,
  onClose,
  onNew,
  onOpen,
  onDelete,
}: {
  scripts: ScriptSummary[];
  currentId: number | null;
  onClose: () => void;
  onNew: () => void;
  onOpen: (id: number) => void;
  onDelete: (id: number, e: MouseEvent) => void;
}) {
  return (
    <div className="absolute inset-0 z-30 flex">
      {/* 抽屉本体（暖色磨砂玻璃） */}
      <div className="glass-warm flex h-full w-[78%] max-w-[300px] flex-col rounded-r-panel">
        <div className="flex items-center justify-between px-4 py-4">
          <span className="text-section">我的脚本</span>
          <button
            onClick={onClose}
            className="text-text-tertiary transition-colors hover:text-text-primary"
          >
            <X size={18} />
          </button>
        </div>

        <button
          onClick={onNew}
          className="mx-3 mb-2 flex items-center gap-2 rounded-control bg-accent/15 px-3 py-2.5 text-body text-accent transition-colors hover:bg-accent/25"
        >
          <Plus size={17} />
          <span>新建脚本</span>
        </button>

        <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-3">
          {scripts.length === 0 ? (
            <p className="px-3 py-6 text-center text-label text-text-tertiary">
              还没有保存的脚本
            </p>
          ) : (
            scripts.map((s) => (
              <button
                key={s.id}
                onClick={() => onOpen(s.id)}
                className={
                  "group flex w-full items-center gap-2.5 rounded-control px-3 py-2.5 text-left transition-colors " +
                  (s.id === currentId
                    ? "bg-white/[0.06]"
                    : "hover:bg-white/[0.03]")
                }
              >
                <FileCode2 size={16} className="shrink-0 text-text-tertiary" />
                <span className="min-w-0 flex-1 truncate text-body text-text-primary">
                  {s.title}
                </span>
                <span
                  onClick={(e) => onDelete(s.id, e)}
                  className="shrink-0 text-text-tertiary opacity-0 transition-opacity hover:text-status-fail group-hover:opacity-100"
                >
                  <Trash2 size={15} />
                </span>
              </button>
            ))
          )}
        </div>
      </div>

      {/* 点击遮罩关闭 */}
      <div className="h-full flex-1 bg-black/40" onClick={onClose} />
    </div>
  );
}
