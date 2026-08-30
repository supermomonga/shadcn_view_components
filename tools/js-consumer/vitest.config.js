import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    environment: "jsdom",
    maxWorkers: 1,
    minWorkers: 1,
    restoreMocks: true,
    setupFiles: ["./test/setup.js"],
  },
})
