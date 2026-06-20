import { useEffect, useRef, useState, useCallback } from "react";
import { X, CornerDownLeft } from "lucide-react";

type Line = { s: "out" | "err" | "in" | "sys"; d: string };

export function InteractiveConsole({ code, onClose }: { code: string; onClose: () => void }) {
  const [lines, setLines] = useState<Line[]>([]);
  const [input, setInput] = useState("");
  const [running, setRunning] = useState(true);
  const wsRef = useRef<WebSocket | null>(null);
  const outRef = useRef<HTMLDivElement | null>(null);

  const add = useCallback((l: Line) => {
    setLines((p) => (p.length > 3000 ? [...p.slice(-3000), l] : [...p, l]));
  }, []);

  useEffect(() => {
    const proto = window.location.protocol === "https:" ? "wss" : "ws";
    const ws = new WebSocket(proto + "://" + window.location.host + "/api/run/ws");
    wsRef.current = ws;
    ws.onopen = () => ws.send(JSON.stringify({ type: "start", code }));
    ws.onmessage = (ev) => {
      let m: any;
      try { m = JSON.parse(ev.data); } catch { return; }
      if (m.type === "output") add({ s: m.stream === "stderr" ? "err" : "out", d: m.data });
      else if (m.type === "exit") { setRunning(false); add({ s: "sys", d: "\n[结束 " + m.code + "]" }); }
      else if (m.type === "error") { setRunning(false); add({ s: "err", d: "\n[错误] " + m.data }); }
    };
    ws.onclose = () => setRunning(false);
    ws.onerror = () => { setRunning(false); add({ s: "err", d: "\n[连接出错]" }); };
    return () => { try { ws.close(); } catch (e) { void e; } };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (outRef.current) outRef.current.scrollTop = outRef.current.scrollHeight;
  }, [lines]);

  const send = useCallback(() => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== 1 || !running) return;
    add({ s: "in", d: input + "\n" });
    ws.send(JSON.stringify({ type: "stdin", data: input }));
    setInput("");
  }, [input, running, add]);

  const color = (s: Line["s"]) =>
    s === "err" ? "text-status-fail" : s === "in" ? "text-accent" : s === "sys" ? "text-text-tertiary" : "text-text-primary";

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-bg-base">
      <header className="flex shrink-0 items-center gap-2 border-b border-glass px-3 py-2.5">
        <span className="text-body font-medium text-text-primary">交互运行</span>
        <span className="text-label text-text-tertiary">{running ? "运行中…" : "已结束"}</span>
        <button onClick={onClose} aria-label="关闭" className="ml-auto flex h-8 w-8 items-center justify-center rounded-control text-text-secondary hover:bg-white/[0.06] hover:text-text-primary">
          <X size={18} />
        </button>
      </header>
      <div ref={outRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-bg-editor px-4 py-3 font-mono text-code leading-6">
        {lines.length === 0 ? (
          <span className="text-text-tertiary">正在启动…</span>
        ) : (
          lines.map((l, i) => <span key={i} className={"whitespace-pre-wrap " + color(l.s)}>{l.d}</span>)
        )}
      </div>
      <div className="flex shrink-0 items-center gap-2 border-t border-glass px-3 py-2.5">
        <input value={input} disabled={!running} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); send(); } }} placeholder={running ? "输入后回车…" : "已结束"} spellCheck={false} autoCapitalize="off" autoCorrect="off" className="min-w-0 flex-1 rounded-control bg-white/[0.06] px-3 py-2 font-mono text-code text-text-primary outline-none placeholder:text-text-tertiary disabled:opacity-50" />
        <button onClick={send} disabled={!running} aria-label="发送" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-control bg-accent text-white hover:bg-accent-hover disabled:opacity-40">
          <CornerDownLeft size={18} />
        </button>
      </div>
    </div>
  );
}
