import path from "node:path"
import { fileURLToPath } from "node:url"

/** リポジトリルート。tools/extractor/src/ から3階層上。 */
export const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..")

export const DEFAULT_PATHS = {
  vendorDir: path.join(REPO_ROOT, "vendor", "shadcn"),
  genDir: path.join(REPO_ROOT, "gen", "contracts"),
  rubyDir: path.join(REPO_ROOT, "lib", "shadcn_view_components", "generated", "contracts"),
  cssFile: path.join(REPO_ROOT, "app", "assets", "stylesheets", "shadcn", "shadcn.css"),
  engineCssFile: path.join(REPO_ROOT, "app", "assets", "tailwind", "shadcn_view_components", "engine.css"),
  upstreamCssFile: path.join(REPO_ROOT, "tools", "visual-parity", "src", "upstream_theme.css"),
  configDir: path.join(REPO_ROOT, "tools", "extractor", "config"),
} as const

export type DefaultPaths = typeof DEFAULT_PATHS
