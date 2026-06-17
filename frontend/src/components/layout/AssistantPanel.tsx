import { Copy, Lightbulb, Check } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface AssistantPanelProps {
  // 第一阶段静态占位；后续接入真实代码/输出
  hint?: string;
}

export function AssistantPanel({ hint }: AssistantPanelProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    // 第一阶段：占位文本。后续替换为真实 code + stdout + stderr
    const payload =
      "代码:\n```python\n# 你的代码\n```\n输出:\n# 运行结果\n\n请帮我讲解上面的代码/报错。";
    try {
      await navigator.clipboard.writeText(payload);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  return (
    <aside className="glass flex h-full flex-col rounded-panel">
      {/* 标题 */}
      <div className="flex items-center gap-2 border-b border-glass px-4 py-3.5">
        <Lightbulb size={16} className="text-status-info" />
        <span className="text-label text-text-primary">助手</span>
      </div>

      {/* 内容 */}
      <div className="flex flex-1 flex-col gap-4 overflow-auto px-4 py-4">
        {/* 提示卡片 */}
        <div className="rounded-card border border-glass bg-white/[0.02] p-3.5">
          <div className="mb-1.5 text-label text-text-secondary">本题提示</div>
          <p className="text-body text-text-secondary">
            {hint ?? "用 requests.get() 获取页面，再用 BeautifulSoup 解析。注意给请求加 timeout。"}
          </p>
        </div>

        {/* 复制给 AI */}
        <div className="rounded-card border border-glass bg-white/[0.02] p-3.5">
          <div className="mb-1 text-label text-text-primary">遇到报错？</div>
          <p className="mb-3 text-body text-text-secondary">
            一键复制你的代码和报错，粘贴到 AI 里问，几秒就能拿到解释。
          </p>
          <button
            onClick={handleCopy}
            className={cn(
              "flex h-9 w-full items-center justify-center gap-2 rounded-control text-label transition-colors",
              copied
                ? "bg-status-pass/15 text-status-pass"
                : "bg-white/[0.06] text-text-primary hover:bg-white/[0.1]"
            )}
          >
            {copied ? (
              <>
                <Check size={14} />
                <span>已复制</span>
              </>
            ) : (
              <>
                <Copy size={14} />
                <span>复制代码 + 报错</span>
              </>
            )}
          </button>
        </div>
      </div>
    </aside>
  );
}
