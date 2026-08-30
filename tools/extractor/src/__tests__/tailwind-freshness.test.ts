import { describe, expect, it } from "vitest"

import { withoutDependencyPreflight } from "../tailwind-freshness.ts"

describe("withoutDependencyPreflight", () => {
  it("ignores only the dependency-owned first base layer", () => {
    const macOS = [
      "@layer theme { :root { --color: red; } }",
      "@layer base { html { font-family: system-ui; } }",
      "@layer utilities { .block { display: block; } }",
      "@layer base { body { color: var(--color); } }",
    ].join("\n")
    const linux = macOS.replace("font-family: system-ui", "font-family: sans-serif")

    expect(withoutDependencyPreflight(macOS)).toBe(withoutDependencyPreflight(linux))
    expect(withoutDependencyPreflight(macOS)).toContain("@layer utilities")
    expect(withoutDependencyPreflight(macOS)).toContain("body { color: var(--color); }")
  })

  it("keeps project utility differences visible", () => {
    const current = "@layer base { html {} }\n@layer utilities { .block { display: block; } }"
    const stale = "@layer base { html {} }\n@layer utilities { .hidden { display: none; } }"

    expect(withoutDependencyPreflight(current)).not.toBe(withoutDependencyPreflight(stale))
  })

  it("handles braces in comments and quoted values", () => {
    const css = [
      "@layer base {",
      "  /* } */",
      "  [data-value='{'] { content: \"}\"; }",
      "}",
      "@layer utilities { .block { display: block; } }",
    ].join("\n")

    expect(withoutDependencyPreflight(css)).toContain("@layer utilities")
  })

  it("rejects missing and unterminated base layers", () => {
    expect(() => withoutDependencyPreflight("@layer utilities {}"))
      .toThrow("does not contain a base layer")
    expect(() => withoutDependencyPreflight("@layer base { html {}"))
      .toThrow("unterminated base layer")
  })
})
