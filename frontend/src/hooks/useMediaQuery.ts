import { useEffect, useState } from "react";

export type Breakpoint = "mobile" | "tablet" | "desktop";

// 三档断点（与 tailwind.config.js / 设计系统一致）
// <768  手机：编辑器全屏 + 底部 tab + 抽屉
// 768–1023 iPad竖屏：导航/助手收成图标条
// ≥1024 桌面：完整四象限
function getBreakpoint(width: number): Breakpoint {
  if (width >= 1024) return "desktop";
  if (width >= 768) return "tablet";
  return "mobile";
}

export function useBreakpoint(): Breakpoint {
  const [bp, setBp] = useState<Breakpoint>(() =>
    typeof window === "undefined" ? "desktop" : getBreakpoint(window.innerWidth)
  );

  useEffect(() => {
    let frame = 0;
    const onResize = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => setBp(getBreakpoint(window.innerWidth)));
    };
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(frame);
    };
  }, []);

  return bp;
}
