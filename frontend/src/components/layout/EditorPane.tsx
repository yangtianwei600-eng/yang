import type { RunState } from "@/types/run";

interface EditorPaneProps {
  runState: RunState;
}

// ── 第一阶段占位：静态代码视图（展示"舞台"视觉）
// 后续阶段此组件整体替换为 Monaco Editor，editor-frame 外壳保留。
// 示例代码用爬虫片段，贴合实际学习目标。
const SAMPLE_LINES: { tokens: { t: string; c?: string }[] }[] = [
  { tokens: [{ t: "import", c: "kw" }, { t: " requests" }] },
  { tokens: [{ t: "from", c: "kw" }, { t: " bs4 " }, { t: "import", c: "kw" }, { t: " BeautifulSoup" }] },
  { tokens: [] },
  { tokens: [{ t: "url " }, { t: "=", c: "op" }, { t: " " }, { t: '"https://example.com"', c: "str" }] },
  { tokens: [{ t: "resp " }, { t: "=", c: "op" }, { t: " requests" }, { t: ".", c: "op" }, { t: "get", c: "fn" }, { t: "(url, timeout" }, { t: "=", c: "op" }, { t: "10", c: "num" }, { t: ")" }] },
  { tokens: [{ t: "soup " }, { t: "=", c: "op" }, { t: " " }, { t: "BeautifulSoup", c: "fn" }, { t: "(resp.text, " }, { t: '"html.parser"', c: "str" }, { t: ")" }] },
  { tokens: [] },
  { tokens: [{ t: "for", c: "kw" }, { t: " link " }, { t: "in", c: "kw" }, { t: " soup" }, { t: ".", c: "op" }, { t: "select", c: "fn" }, { t: "(" }, { t: '"a"', c: "str" }, { t: "):" }] },
  { tokens: [{ t: "    " }, { t: "print", c: "fn" }, { t: "(link" }, { t: ".", c: "op" }, { t: "get", c: "fn" }, { t: "(" }, { t: '"href"', c: "str" }, { t: "))" }] },
];

const TOKEN_COLOR: Record<string, string> = {
  kw: "text-[#C792EA]", // 关键字 紫
  str: "text-[#C3E88D]", // 字符串 绿
  num: "text-[#F78C6C]", // 数字 橙
  fn: "text-[#82AAFF]", // 函数 蓝
  op: "text-[#89DDFF]", // 运算符 青
};

export function EditorPane({ runState }: EditorPaneProps) {
  return (
    <div
      data-runstate={runState}
      className="editor-frame flex h-full flex-col overflow-hidden bg-bg-editor"
    >
      {/* 文件标签栏 */}
      <div className="flex items-center gap-2 border-b border-white/[0.05] px-4 py-2">
        <span className="h-2 w-2 rounded-full bg-status-warn/70" />
        <span className="font-mono text-label text-text-secondary">main.py</span>
      </div>

      {/* 代码区 */}
      <div className="flex flex-1 overflow-auto font-mono text-code">
        {/* 行号 */}
        <div className="select-none border-r border-white/[0.04] px-3 py-3 text-right text-text-tertiary">
          {SAMPLE_LINES.map((_, i) => (
            <div key={i} className="tnum leading-5">
              {i + 1}
            </div>
          ))}
        </div>
        {/* 代码 */}
        <div className="flex-1 overflow-x-auto px-4 py-3">
          {SAMPLE_LINES.map((line, i) => (
            <div key={i} className="leading-5 whitespace-pre">
              {line.tokens.length === 0 ? (
                <span>&nbsp;</span>
              ) : (
                line.tokens.map((tok, j) => (
                  <span key={j} className={tok.c ? TOKEN_COLOR[tok.c] : "text-text-primary"}>
                    {tok.t}
                  </span>
                ))
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
