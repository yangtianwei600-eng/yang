import { useState, useRef } from "react";
import type { KeyboardEvent } from "react";
import { api, ApiError } from "@/lib/api";
import type { ExerciseOut, JudgeResult } from "@/types/api";
import { Play, Loader2, CheckCircle2, XCircle, Clock } from "lucide-react";

type RunState = "idle" | "running" | "pass" | "fail" | "error";

export function ExerciseCard({
  exercise,
  onPassed,
}: {
  exercise: ExerciseOut;
  onPassed?: (exerciseId: number) => void;
}) {
  const [code, setCode] = useState(exercise.starter_code);
  const [state, setState] = useState<RunState>("idle");
  const [result, setResult] = useState<JudgeResult | null>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);

  const handleRun = async () => {
    setState("running");
    setResult(null);
    try {
      const r = await api.judgeExercise(exercise.id, code);
      setResult(r);
      if (r.passed) {
        setState("pass");
        onPassed?.(exercise.id);
      } else {
        setState("fail");
      }
    } catch (e) {
      setState("error");
      const msg = e instanceof ApiError ? e.message : "运行失败";
      setResult({
        stdout: "",
        stderr: msg,
        exit_code: -1,
        timed_out: false,
        duration_ms: 0,
        passed: false,
        expected_output: null,
      });
    }
  };

  // Tab 键插入 4 空格而不是切换焦点
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const ta = taRef.current;
      if (!ta) return;
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const next = code.slice(0, start) + "    " + code.slice(end);
      setCode(next);
      requestAnimationFrame(() => {
        ta.selectionStart = ta.selectionEnd = start + 4;
      });
    }
  };

  const lineCount = code.split("\n").length;

  // 映射到设计系统 .editor-frame 的 data-runstate
  const frameState =
    state === "running"
      ? "running"
      : state === "pass"
      ? "success"
      : state === "fail" || state === "error"
      ? "error"
      : "idle";

  return (
    <div className="glass rounded-panel p-5">
      <h3 className="mb-1 text-body font-semibold text-text-primary">
        {exercise.title}
      </h3>
      <p className="mb-3 text-body text-text-secondary">{exercise.prompt}</p>

      {/* 编辑器（带执行光带） */}
      <div
        className="editor-frame overflow-hidden rounded-card border border-white/[0.05]"
        data-runstate={frameState}
      >
        <div className="flex bg-bg-editor">
          {/* 行号 */}
          <div className="select-none py-3 pl-3 pr-2 text-right font-mono text-code leading-5 text-text-tertiary">
            {Array.from({ length: lineCount }, (_, i) => (
              <div key={i}>{i + 1}</div>
            ))}
          </div>
          {/* 代码输入 */}
          <textarea
            ref={taRef}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={handleKeyDown}
            spellCheck={false}
            autoCapitalize="off"
            autoCorrect="off"
            rows={Math.max(lineCount, 3)}
            className="flex-1 resize-none border-0 bg-transparent py-3 pr-3 font-mono text-code leading-5 text-text-primary outline-none"
            style={{ tabSize: 4 }}
          />
        </div>
      </div>

      {/* 运行按钮 + 状态 */}
      <div className="mt-3 flex items-center gap-3">
        <button
          onClick={handleRun}
          disabled={state === "running"}
          className="flex h-9 items-center gap-2 rounded-control bg-accent px-4 text-label font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-60"
        >
          {state === "running" ? (
            <Loader2 size={15} className="animate-spin" />
          ) : (
            <Play size={15} />
          )}
          <span>{state === "running" ? "运行中" : "运行"}</span>
        </button>

        {state === "pass" && (
          <span className="flex items-center gap-1.5 text-label text-status-pass">
            <CheckCircle2 size={15} /> 通过
          </span>
        )}
        {state === "fail" && (
          <span className="flex items-center gap-1.5 text-label text-status-fail">
            {result?.timed_out ? <Clock size={15} /> : <XCircle size={15} />}
            {result?.timed_out ? "超时" : "未通过"}
          </span>
        )}
        {state === "error" && (
          <span className="flex items-center gap-1.5 text-label text-status-fail">
            <XCircle size={15} /> 出错
          </span>
        )}
        {result && result.duration_ms > 0 && (
          <span className="tnum text-badge text-text-tertiary">
            {result.duration_ms}ms
          </span>
        )}
      </div>

      {/* 输出控制台 */}
      {result && (state === "pass" || state === "fail" || state === "error") && (
        <div className="mt-3 overflow-hidden rounded-card border border-white/[0.05] bg-bg-editor">
          <div className="border-b border-white/[0.05] px-3 py-1.5 text-badge text-text-tertiary">
            输出
          </div>
          <pre className="max-h-64 overflow-auto px-3 py-2 font-mono text-code leading-5">
            {result.stdout && (
              <span className="text-text-primary">{result.stdout}</span>
            )}
            {result.stderr && (
              <span className="text-status-fail">{result.stderr}</span>
            )}
            {!result.stdout && !result.stderr && (
              <span className="text-text-tertiary">（无输出）</span>
            )}
          </pre>
          {/* 判错时显示预期输出 */}
          {state === "fail" && result.expected_output && (
            <div className="border-t border-white/[0.05] px-3 py-2">
              <div className="mb-1 text-badge text-text-tertiary">预期输出</div>
              <pre className="font-mono text-code leading-5 text-status-pass">
                {result.expected_output}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
