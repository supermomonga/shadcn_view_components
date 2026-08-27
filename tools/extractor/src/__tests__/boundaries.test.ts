import { readdir, readFile } from "node:fs/promises"
import path from "node:path"
import { describe, expect, it } from "vitest"

/**
 * 境界テスト: fetch.ts(sync専用・唯一のネットワーク接点)はcli.tsからのみimportしてよい
 * (03-extraction-codegen §2)。extract以降のパイプラインがネットワークに依存しないことの機械検査。
 */
describe("module boundaries", () => {
  it("only cli.ts may import fetch.ts", async () => {
    const srcDir = path.resolve(import.meta.dirname, "..")
    const files = (await readdir(srcDir, { recursive: true }))
      .filter((file) => file.toString().endsWith(".ts") && !file.toString().endsWith(".test.ts"))
      .filter((file) => !file.toString().startsWith("__tests__"))

    const offenders: string[] = []
    for (const file of files) {
      const content = await readFile(path.join(srcDir, file.toString()), "utf8")
      if (/from\s+"(\.\.?\/)*(fetch(\.ts)?)"/.test(content) && file.toString() !== path.join("cli.ts")) {
        offenders.push(file.toString())
      }
    }
    expect(offenders).toEqual([])
  })

  it("no source file besides normalize-free paths reads process.env", async () => {
    const srcDir = path.resolve(import.meta.dirname, "..")
    const files = (await readdir(srcDir, { recursive: true }))
      .filter((file) => file.toString().endsWith(".ts") && !file.toString().endsWith(".test.ts"))
    const offenders: string[] = []
    for (const file of files) {
      const content = await readFile(path.join(srcDir, file.toString()), "utf8")
      if (content.includes("process.env") && !file.toString().startsWith("__tests__") &&
          !["cli.ts", "fetch.ts", "tailwind-check.ts"].includes(file.toString())) {
        offenders.push(file.toString())
      }
    }
    expect(offenders).toEqual([])
  })
})
