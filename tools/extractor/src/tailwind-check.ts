/**
 * 契約クラスが実際に Tailwind v4 ビルドを通るかの検証(06-theming-tailwind §6)。
 * 「upstreamが新ユーティリティを使い始めた際にホストのTailwind v4で解決できないクラスがある」
 * 状況の早期検知。ピクセル単位のビジュアル回帰はスコープ外。
 *
 * CI の tailwind-build ジョブから `pnpm run tailwind:check` として実行される。
 */
import { spawnSync } from "node:child_process"
import { mkdtemp, readFile, writeFile, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"

import { DEFAULT_PATHS, REPO_ROOT } from "./paths.ts"

/** 契約に現れる代表的なユーティリティ。生成CSSに含まれるべき宣言。 */
const EXPECTED_UTILITY_SUBSTRINGS = [
  ".inline-flex",
  ".bg-primary",
  ".text-primary-foreground",
  ".hover\\:bg-primary\\/90",
  ".h-9",
  ".size-9",
  ".rounded-md",
  ".text-sm",
  ".disabled\\:opacity-50",
]

async function main(): Promise<number> {
  const workDir = await mkdtemp(path.join(tmpdir(), "shadcn-tailwind-check-"))
  const inputPath = path.join(workDir, "input.css")
  const outputPath = path.join(workDir, "output.css")

  // gem のインストール手順(06 §5.1)と同じ構成: tailwindcss + gemのテーマCSS + @source
  const input = [
    '@import "tailwindcss";',
    `@import "${DEFAULT_PATHS.cssFile}";`,
    `@source "${path.join(REPO_ROOT, "app", "components")}";`,
    `@source "${DEFAULT_PATHS.genDir}";`,
    "",
  ].join("\n")
  await writeFile(inputPath, input, "utf8")

  const result = spawnSync(
    process.execPath,
    [path.join(REPO_ROOT, "tools", "extractor", "node_modules", "@tailwindcss", "cli", "dist", "index.mjs"),
      "--input", inputPath, "--output", outputPath],
    { cwd: REPO_ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
  )
  if (result.status !== 0) {
    process.stderr.write(`tailwind build failed:\n${result.stdout}\n${result.stderr}\n`)
    await rm(workDir, { recursive: true, force: true })
    return 1
  }

  const css = await readFile(outputPath, "utf8")
  const missing = EXPECTED_UTILITY_SUBSTRINGS.filter((needle) => !css.includes(needle))
  await rm(workDir, { recursive: true, force: true })

  if (missing.length > 0) {
    process.stderr.write(`tailwind build check FAILED — missing utilities in generated CSS:\n`)
    for (const needle of missing) process.stderr.write(`  - ${needle}\n`)
    return 1
  }
  process.stdout.write(`tailwind build check passed (${css.length} bytes of CSS, all expected utilities present)\n`)
  return 0
}

main().then(
  (code) => process.exit(code),
  (error) => {
    process.stderr.write(`ERROR: ${error instanceof Error ? error.stack : String(error)}\n`)
    process.exit(1)
  },
)
