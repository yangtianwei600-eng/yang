import { useRef, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import type { OutputLine, RunState } from "@/types/run";

// ── 第一阶段：假运行器
// 仅用于演示状态机 + 签名光带 + 控制台联动。
// 后续阶段替换为 useCodeRunner（真实 WebSocket → VPS Docker 执行）。
const FAKE_SUCCESS: OutputLine[] = [
  { stream: "stdout", data: "/about" },
  { stream: "stdout", data: "/contact" },
  { stream: "stdout", data: "/products" },
  { stream: "stdout", data: "/blog" },
];

const FAKE_ERROR: OutputLine[] = [
  { stream: "stderr", data: "Traceback (most recent call last):" },
  { stream: "stderr", data: '  File "main.py", line 5, in <module>' },
  { stream: "stderr", data: "    resp = requests.get(url, timeout=10)" },
  { stream: "stderr", data: "requests.exceptions.ConnectionError: Failed to resolve host" },
];

export default function App() {
  const [runState, setRunState] = useState<RunState>("idle");
  const [lines, setLines] = useState<OutputLine[]>([]);
  const [durationMs, setDurationMs] = useState<number | null>(null);
  const timers = useRef<number[]>([]);

  const clearTimers = () => {
    timers.current.forEach((t) => clearTimeout(t));
    timers.current = [];
  };

  const handleRun = () => {
    clearTimers();
    setRunState("running");
    setLines([]);
    setDurationMs(null);

    const success = Math.random() > 0.4;
    const output = success ? FAKE_SUCCESS : FAKE_ERROR;

    // 逐行追加，模拟流式输出
    output.forEach((line, i) => {
      const t = window.setTimeout(() => {
        setLines((prev) => [...prev, line]);
      }, 350 + i * 280);
      timers.current.push(t);
    });

    // 结束
    const endDelay = 350 + output.length * 280 + 200;
    const tEnd = window.setTimeout(() => {
      setRunState(success ? "success" : "error");
      setDurationMs(Math.floor(120 + Math.random() * 380));
    }, endDelay);
    timers.current.push(tEnd);
  };

  const handleStop = () => {
    clearTimers();
    setRunState("idle");
  };

  return (
    <AppShell
      runState={runState}
      lines={lines}
      durationMs={durationMs}
      onRun={handleRun}
      onStop={handleStop}
    />
  );
}
