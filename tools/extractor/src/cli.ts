import { mkdtemp, readdir, readFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"
import { spawnSync } from "node:child_process"

import { syncVendor } from "./fetch.ts"
import { generateAll, extractContracts, type PipelinePaths } from "./pipeline.ts"
import { DEFAULT_PATHS, REPO_ROOT } from "./paths.ts"

const USAGE = `usage: tsx src/cli.ts <command> [options]

commands:
  fetch                   vendor スナップショットを更新する(rake shadcn:sync の実体)
  extract [--only NAME]   vendor から契約JSONを生成する(gen/contracts/)
  generate [--only NAME]  契約JSON + Ruby + CSS を生成する(rake shadcn:generate の実体)
  check                   一時ディレクトリに生成し、コミット済み生成物とバイト単位比較(rake shadcn:check の実体)

options:
  --only NAME       抽出対象を指定アイテムに絞る(デバッグ用)
  --vendor DIR      vendor ディレクトリの上書き(テスト・fixture用)
  --gen DIR         契約JSON出力先の上書き
  --ruby-out DIR    生成Ruby出力先の上書き
  --css-out FILE    生成CSS出力先の上書き
`

interface CliOptions {
  only?: string[]
  vendorDir?: string
  genDir?: string
  rubyDir?: string
  cssFile?: string
}

function parseArgs(argv: string[]): { command: string, options: CliOptions } {
  const [command, ...rest] = argv
  if (!command || !["fetch", "extract", "generate", "check"].includes(command)) {
    process.stderr.write(USAGE)
    process.exit(2)
  }
  const options: CliOptions = {}
  const valueFlags: Record<string, keyof CliOptions> = {
    only: "only",
    vendor: "vendorDir",
    gen: "genDir",
    "ruby-out": "rubyDir",
    "css-out": "cssFile",
  }
  for (let i = 0; i < rest.length; i += 1) {
    const arg = rest[i]!
    const flagName = arg.replace(/^--/, "")
    if (arg.startsWith("--") && flagName in valueFlags) {
      const target = valueFlags[flagName]!
      const value = rest[i + 1]
      if (!value) {
        process.stderr.write(`${arg} requires a value\n`)
        process.exit(2)
      }
      if (target === "only") {
        options.only = [...(options.only ?? []), value]
      } else {
        (options as Record<string, string | undefined>)[target] = value
      }
      i += 1
    } else {
      process.stderr.write(`unknown option: ${arg}\n${USAGE}`)
      process.exit(2)
    }
  }
  return { command, options }
}

/** CLIフラグで上書きされたパイプラインパス。未指定の項目はリポジトリの既定値。 */
function resolvePaths(options: CliOptions): PipelinePaths {
  return {
    vendorDir: options.vendorDir ?? DEFAULT_PATHS.vendorDir,
    genDir: options.genDir ?? DEFAULT_PATHS.genDir,
    rubyDir: options.rubyDir ?? DEFAULT_PATHS.rubyDir,
    cssFile: options.cssFile ?? DEFAULT_PATHS.cssFile,
    configDir: DEFAULT_PATHS.configDir,
  }
}

async function reportSkipped(skipped: string[]): Promise<void> {
  if (skipped.length > 0) {
    process.stdout.write(`skipped (not in tools/extractor/config/targets.json): ${skipped.join(", ")}\n`)
  }
}

async function runFetch(): Promise<number> {
  const result = await syncVendor(DEFAULT_PATHS.vendorDir)
  process.stdout.write(
    [
      `synced ${result.added.length + result.changed.length + result.unchanged} items ` +
        `(added: ${result.added.length}, changed: ${result.changed.length}, unchanged: ${result.unchanged}, removed: ${result.removed.length})`,
      ...(result.added.length > 0 ? [`  added: ${result.added.join(", ")}`] : []),
      ...(result.changed.length > 0 ? [`  changed: ${result.changed.join(", ")}`] : []),
      ...(result.removed.length > 0 ? [`  removed: ${result.removed.join(", ")}`] : []),
    ].join("\n") + "\n",
  )
  if (result.added.length > 0 || result.changed.length > 0 || result.removed.length > 0) {
    const git = spawnSync("git", ["diff", "--stat", "--", "vendor/shadcn"], { cwd: REPO_ROOT, encoding: "utf8" })
    if (git.status === 0 && git.stdout.trim().length > 0) {
      process.stdout.write("\nvendor diff:\n" + git.stdout)
    } else {
      process.stdout.write("\ninspect changes with: git diff --stat vendor/shadcn\n")
    }
  }
  return 0
}

async function runExtract(options: CliOptions): Promise<number> {
  const report = await extractContracts(resolvePaths(options), options.only)
  for (const contract of report.contracts) {
    process.stdout.write(`extracted ${contract.name} (${Object.keys(contract.exports).length} exports)\n`)
  }
  await reportSkipped(report.skipped)
  return 0
}

async function runGenerate(options: CliOptions): Promise<number> {
  const report = await generateAll(resolvePaths(options), options.only)
  for (const file of report.files.json) process.stdout.write(`generated ${file}\n`)
  for (const file of report.files.ruby) process.stdout.write(`generated ${file}\n`)
  process.stdout.write(`generated ${report.files.css}\n`)
  for (const removed of report.removed.json) process.stdout.write(`removed stale contract json: ${removed}\n`)
  for (const removed of report.removed.ruby) process.stdout.write(`removed stale contract ruby: ${removed}\n`)
  await reportSkipped(report.skipped)
  return 0
}

async function listFiles(dir: string): Promise<Map<string, string>> {
  const files = new Map<string, string>()
  let entries: string[] = []
  try {
    entries = await readdir(dir)
  } catch {
    return files
  }
  for (const entry of entries.sort()) {
    if (!entry.endsWith(".json") && !entry.endsWith(".rb") && !entry.endsWith(".css")) continue
    files.set(entry, await readFile(path.join(dir, entry), "utf8"))
  }
  return files
}

async function compareDirectories(generatedDir: string, committedDir: string, label: string): Promise<string[]> {
  const generated = await listFiles(generatedDir)
  const committed = await listFiles(committedDir)
  const differences: string[] = []
  for (const name of new Set([...generated.keys(), ...committed.keys()])) {
    if (!committed.has(name)) {
      differences.push(`${label}/${name}: committed output is missing (stale file or incomplete generation)`)
    } else if (!generated.has(name)) {
      differences.push(`${label}/${name}: generated output is missing (committed file was hand-edited or removed upstream)`)
    } else if (generated.get(name) !== committed.get(name)) {
      differences.push(`${label}/${name}: content differs (hand edit or non-deterministic pipeline)`)
    }
  }
  return differences
}

async function runCheck(options: CliOptions): Promise<number> {
  // check は常に既定パスのコミット済み成果物と比較するため、パス系オプションは
  // 受け付けない(静かに無視すると検証対象を誤認させる)
  for (const key of ["vendorDir", "genDir", "rubyDir", "cssFile"] as const) {
    if (options[key]) {
      process.stderr.write(`check does not accept --${key}: it always verifies the committed outputs\n`)
      return 2
    }
  }
  const tempRoot = await mkdtemp(path.join(tmpdir(), "shadcn-view-components-check-"))
  const checkPaths: PipelinePaths = {
    ...DEFAULT_PATHS,
    genDir: path.join(tempRoot, "gen", "contracts"),
    rubyDir: path.join(tempRoot, "lib", "contracts"),
    cssFile: path.join(tempRoot, "shadcn.css"),
  }
  await generateAll(checkPaths)

  const differences: string[] = []
  differences.push(...await compareDirectories(checkPaths.genDir, DEFAULT_PATHS.genDir, "gen/contracts"))
  differences.push(...await compareDirectories(checkPaths.rubyDir, DEFAULT_PATHS.rubyDir, "lib/shadcn_view_components/generated/contracts"))

  const [generatedCss, committedCss] = await Promise.all([
    readFile(checkPaths.cssFile, "utf8"),
    readFile(DEFAULT_PATHS.cssFile, "utf8").catch(() => null),
  ])
  if (committedCss === null) {
    differences.push("app/assets/stylesheets/shadcn/shadcn.css: committed output is missing")
  } else if (generatedCss !== committedCss) {
    differences.push("app/assets/stylesheets/shadcn/shadcn.css: content differs (hand edit or non-deterministic pipeline)")
  }

  if (differences.length > 0) {
    process.stderr.write(`determinism check FAILED (${differences.length} difference(s)):\n`)
    for (const difference of differences) process.stderr.write(`  - ${difference}\n`)
    process.stderr.write("regenerate with: rake shadcn:generate\n")
    return 1
  }
  process.stdout.write("determinism check passed: committed outputs are byte-identical to a fresh generation\n")
  return 0
}

async function main(): Promise<number> {
  const { command, options } = parseArgs(process.argv.slice(2))
  switch (command) {
    case "fetch":
      return runFetch()
    case "extract":
      return runExtract(options)
    case "generate":
      return runGenerate(options)
    case "check":
      return runCheck(options)
    default:
      process.stderr.write(USAGE)
      return 2
  }
}

main().then(
  (code) => process.exit(code),
  (error) => {
    process.stderr.write(`ERROR: ${error instanceof Error ? error.stack : String(error)}\n`)
    process.exit(1)
  },
)
