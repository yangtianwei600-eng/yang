import { LOGIN_URL } from "@/lib/api";

export function LoginScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-base px-6">
      {/* 背景微光 */}
      <div
        className="pointer-events-none fixed inset-0 opacity-40"
        style={{
          background:
            "radial-gradient(600px circle at 50% 30%, rgba(108,111,240,0.12), transparent 70%)",
        }}
      />

      <div className="glass relative w-full max-w-sm rounded-panel p-8">
        {/* Logo */}
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-card bg-accent/15 text-accent">
            <span className="font-mono text-lg font-semibold">Py</span>
          </div>
          <div>
            <div className="text-section">学练</div>
            <div className="text-label text-text-tertiary">Python 学习平台</div>
          </div>
        </div>

        <p className="mb-7 text-body text-text-secondary">
          学 Python、练手、接单赚钱。用谷歌账号登录开始。
        </p>

        <a
          href={LOGIN_URL}
          className="flex h-11 w-full items-center justify-center gap-2.5 rounded-control bg-white font-medium text-[#1a1a1a] transition-opacity hover:opacity-90"
        >
          <GoogleIcon />
          <span className="text-body">用 Google 登录</span>
        </a>

        <p className="mt-5 text-badge leading-relaxed text-text-tertiary">
          仅限受邀邮箱访问。登录需要能连接 Google。
        </p>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.49h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.63z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.02-3.7H.96v2.34A9 9 0 0 0 9 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.98 10.72a5.4 5.4 0 0 1 0-3.44V4.94H.96a9 9 0 0 0 0 8.12l3.02-2.34z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.5.46 3.44 1.35l2.58-2.58A9 9 0 0 0 .96 4.94l3.02 2.34C4.68 5.16 6.66 3.58 9 3.58z"
      />
    </svg>
  );
}
