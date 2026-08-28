import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// upstream パリティ参照アプリのビルド設定。
// @ エイリアスは upstream ソースの import("@/lib/utils" 等)をそのまま通すため
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": new URL("./src/", import.meta.url).pathname,
    },
  },
  build: {
    outDir: "dist",
  },
})
