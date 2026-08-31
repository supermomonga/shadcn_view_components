/**
 * 契約クラスが実際に Tailwind v4 ビルドを通るかの検証(06-theming-tailwind §6)。
 * 「upstreamが新ユーティリティを使い始めた際にホストのTailwind v4で解決できないクラスがある」
 * 状況の早期検知。ピクセル単位のビジュアル回帰はスコープ外。
 *
 * CI の tailwind-build ジョブから `pnpm run tailwind:check` として実行される。
 */
import { spawnSync } from "node:child_process"
import { mkdir, mkdtemp, readFile, writeFile, rm } from "node:fs/promises"
import path from "node:path"

import { DEFAULT_PATHS, REPO_ROOT } from "./paths.ts"
import { withoutDependencyPreflight } from "./tailwind-freshness.ts"

/** 契約に現れる代表的なユーティリティ。生成CSSに含まれるべき宣言。 */
const EXPECTED_UTILITY_SUBSTRINGS = [
  ".inline-flex",
  ".bg-primary",
  ".text-primary-foreground",
  ".hover\\:bg-primary\\/80",
  ".h-9",
  ".size-9",
  ".rounded-md",
  ".text-sm",
  ".disabled\\:opacity-50",
  ".peer-hover\\:ring-3",
  ".peer-focus-visible\\:ring-3",
  ".peer-active\\:ring-3",
  ".peer-disabled\\:pointer-events-none",
  ".animate-spin",
  ".in-data-\\[slot\\=card-content\\]\\:bg-transparent",
  ".top-\\[60\\%\\]",
  ".px-4",
  ".py-3",
]

async function main(): Promise<number> {
  const temporaryRoot = path.join(REPO_ROOT, "tmp")
  await mkdir(temporaryRoot, { recursive: true })
  const workDir = await mkdtemp(path.join(temporaryRoot, "shadcn-tailwind-check-"))
  const inputPath = path.join(workDir, "input.css")
  const outputPath = path.join(workDir, "output.css")
  const dummyOutputPath = path.join(workDir, "dummy.css")
  const dummyInputPath = path.join(REPO_ROOT, "spec", "dummy", "tailwind", "input.css")
  const committedDummyCssPath = path.join(
    REPO_ROOT,
    "spec",
    "dummy",
    "app",
    "assets",
    "stylesheets",
    "application.css",
  )

  // 公開Engine entryと同じ構成で、配布対象だけから必要なクラスを生成できることを検証する。
  const input = [
    '@import "tailwindcss" source(none);',
    '@import "tw-animate-css";',
    `@import "${DEFAULT_PATHS.engineCssFile}";`,
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
  if (missing.length > 0) {
    process.stderr.write(`tailwind build check FAILED — missing utilities in generated CSS:\n`)
    for (const needle of missing) process.stderr.write(`  - ${needle}\n`)
    await rm(workDir, { recursive: true, force: true })
    return 1
  }

  // Lookbook / system spec はTailwindを実行せず、追跡済みのdummy CSSを読む。
  // component側へclassを追加したのに `mise run build-css` を忘れると、実ブラウザ検証が
  // その状態を適用しないまま通るため、同じ入力からの再生成結果とバイト単位で比較する。
  const dummyResult = spawnSync(
    process.execPath,
    [path.join(REPO_ROOT, "tools", "extractor", "node_modules", "@tailwindcss", "cli", "dist", "index.mjs"),
      "--input", dummyInputPath, "--output", dummyOutputPath],
    { cwd: REPO_ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
  )
  if (dummyResult.status !== 0) {
    process.stderr.write(`dummy tailwind build failed:\n${dummyResult.stdout}\n${dummyResult.stderr}\n`)
    await rm(workDir, { recursive: true, force: true })
    return 1
  }

  const [generatedDummyCss, committedDummyCss] = await Promise.all([
    readFile(dummyOutputPath, "utf8"),
    readFile(committedDummyCssPath, "utf8"),
  ])
  if (withoutDependencyPreflight(generatedDummyCss) !== withoutDependencyPreflight(committedDummyCss)) {
    process.stderr.write(
      "dummy Tailwind CSS is stale — run `mise run build-css` and commit " +
        "spec/dummy/app/assets/stylesheets/application.css\n",
    )
    await rm(workDir, { recursive: true, force: true })
    return 1
  }

  await rm(workDir, { recursive: true, force: true })
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
