import { defineConfig } from "vite";

export default defineConfig({
  server: {
    // Bind 0.0.0.0 so a phone on the same LAN can reach this remote dev box.
    host: true,
    port: 5173,
    strictPort: true,
  },
  build: {
    target: "es2020",
    sourcemap: true,
  },
});
