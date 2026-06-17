/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    // 三档断点对应设计系统：手机 / iPad竖屏 / 桌面四象限
    screens: {
      tablet: "768px",
      desktop: "1024px",
    },
    extend: {
      colors: {
        bg: {
          base: "rgb(var(--bg-base) / <alpha-value>)",
          surface: "rgb(var(--bg-surface) / <alpha-value>)",
          editor: "rgb(var(--bg-editor) / <alpha-value>)",
        },
        text: {
          primary: "rgb(var(--text-primary) / <alpha-value>)",
          secondary: "rgb(var(--text-secondary) / <alpha-value>)",
          tertiary: "rgb(var(--text-tertiary) / <alpha-value>)",
        },
        accent: {
          DEFAULT: "rgb(var(--accent-primary) / <alpha-value>)",
          hover: "rgb(var(--accent-primary-hover) / <alpha-value>)",
        },
        status: {
          pass: "rgb(var(--status-pass) / <alpha-value>)",
          fail: "rgb(var(--status-fail) / <alpha-value>)",
          warn: "rgb(var(--status-warn) / <alpha-value>)",
          info: "rgb(var(--status-info) / <alpha-value>)",
        },
      },
      borderColor: {
        glass: "var(--glass-border)",
        "glass-top": "var(--glass-border-top)",
      },
      backgroundColor: {
        glass: "var(--glass-fill)",
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "PingFang SC", "Microsoft YaHei", "sans-serif"],
        mono: ["JetBrains Mono", "Menlo", "Consolas", "monospace"],
      },
      borderRadius: {
        control: "8px",
        card: "10px",
        panel: "16px",
      },
      fontSize: {
        // 设计系统字号阶梯
        display: ["28px", { lineHeight: "36px", fontWeight: "600" }],
        section: ["20px", { lineHeight: "28px", fontWeight: "600" }],
        body: ["14px", { lineHeight: "22px" }],
        code: ["14px", { lineHeight: "20px" }],
        console: ["13px", { lineHeight: "18px" }],
        label: ["12px", { lineHeight: "16px", letterSpacing: "0.02em", fontWeight: "500" }],
        badge: ["11px", { lineHeight: "14px", fontWeight: "600" }],
      },
    },
  },
  plugins: [],
};
