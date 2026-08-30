import js from "@eslint/js"
import { defineConfig } from "eslint/config"

const browserGlobals = Object.fromEntries(
  [
    "clearTimeout",
    "document",
    "DOMRect",
    "Element",
    "HTMLElement",
    "Node",
    "setTimeout",
    "window",
  ].map((name) => [name, "readonly"]),
)

export default defineConfig([
  {
    files: ["fixture/vendor/shadcn-view-components/**/*.js"],
    languageOptions: {
      ecmaVersion: 2022,
      globals: browserGlobals,
      sourceType: "module",
    },
    rules: js.configs.recommended.rules,
  },
])
