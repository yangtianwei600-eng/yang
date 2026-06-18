import { CodeBlock } from "./CodeBlock";
import type { ReactNode } from "react";

// 轻量 Markdown 渲染（覆盖课程内容常用语法）
// 支持：# ## ### 标题、段落、``` 代码块、`行内代码`、**粗体**、- 列表

function renderInline(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  // 依次处理 `code` 和 **bold**
  const regex = /(`[^`]+`|\*\*[^*]+\*\*)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let key = 0;
  while ((m = regex.exec(text)) !== null) {
    if (m.index > last) nodes.push(text.slice(last, m.index));
    const tok = m[0];
    if (tok.startsWith("`")) {
      nodes.push(
        <code
          key={key++}
          className="rounded bg-white/[0.06] px-1.5 py-0.5 font-mono text-[13px] text-status-info"
        >
          {tok.slice(1, -1)}
        </code>
      );
    } else {
      nodes.push(
        <strong key={key++} className="font-semibold text-text-primary">
          {tok.slice(2, -2)}
        </strong>
      );
    }
    last = m.index + tok.length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

export function Markdown({ content }: { content: string }) {
  const lines = content.split("\n");
  const blocks: ReactNode[] = [];
  let i = 0;
  let key = 0;

  while (i < lines.length) {
    const line = lines[i];

    // 代码块
    if (line.trimStart().startsWith("```")) {
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trimStart().startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // 跳过结束的 ```
      blocks.push(
        <div key={key++} className="my-3">
          <CodeBlock code={codeLines.join("\n")} />
        </div>
      );
      continue;
    }

    // 标题
    if (line.startsWith("### ")) {
      blocks.push(
        <h3 key={key++} className="mb-2 mt-4 text-body font-semibold text-text-primary">
          {renderInline(line.slice(4))}
        </h3>
      );
      i++;
      continue;
    }
    if (line.startsWith("## ")) {
      blocks.push(
        <h2 key={key++} className="mb-2 mt-5 text-section">
          {renderInline(line.slice(3))}
        </h2>
      );
      i++;
      continue;
    }
    if (line.startsWith("# ")) {
      blocks.push(
        <h1 key={key++} className="mb-3 mt-2 text-display">
          {renderInline(line.slice(2))}
        </h1>
      );
      i++;
      continue;
    }

    // 列表
    if (line.startsWith("- ")) {
      const items: string[] = [];
      while (i < lines.length && lines[i].startsWith("- ")) {
        items.push(lines[i].slice(2));
        i++;
      }
      blocks.push(
        <ul key={key++} className="my-3 space-y-1.5 pl-5">
          {items.map((it, idx) => (
            <li key={idx} className="list-disc text-body text-text-secondary">
              {renderInline(it)}
            </li>
          ))}
        </ul>
      );
      continue;
    }

    // 空行
    if (line.trim() === "") {
      i++;
      continue;
    }

    // 段落（合并连续非空行）
    const paraLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !lines[i].startsWith("#") &&
      !lines[i].startsWith("- ") &&
      !lines[i].trimStart().startsWith("```")
    ) {
      paraLines.push(lines[i]);
      i++;
    }
    blocks.push(
      <p key={key++} className="my-3 text-body leading-relaxed text-text-secondary">
        {renderInline(paraLines.join(" "))}
      </p>
    );
  }

  return <div>{blocks}</div>;
}
