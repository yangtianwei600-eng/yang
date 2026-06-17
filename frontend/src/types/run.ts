// 代码执行状态机（贯穿前后端）
// idle --(点击运行)--> running
// running --(exit_code===0)--> success
// running --(exit_code!==0)--> error
// success / error --(再次运行)--> running
export type RunState = "idle" | "running" | "success" | "error";

// 控制台单行输出
export interface OutputLine {
  stream: "stdout" | "stderr";
  data: string;
}

// 导航区段（左侧导航 / 手机底部 tab）
export type Section = "learn" | "review" | "challenge" | "progress";
