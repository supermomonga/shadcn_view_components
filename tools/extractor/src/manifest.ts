/** vendor スナップショットの manifest スキーマ(02-upstream-sync §4)。型のみ。URL定義は fetch.ts に集約。 */

export interface UpstreamRelease {
  tag: string
  resolved_sha: string
  checked_at: string
}

export interface ManifestItem {
  path: string
  sha256: string
  file_count: number
  registry_dependencies: string[]
  origin: "upstream" | "local-override"
}

export interface Manifest {
  version: number
  source: {
    style: string
    registry_base_url: string
    /** スタイル共通のnpm依存(bootstapアイテム registry:style 由来)。出所の参考情報 */
    style_dependencies: string[]
    style_dev_dependencies: string[]
    upstream_release: UpstreamRelease | null
  }
  fetched_at: string
  theme: { base_color: string, path: string, sha256: string }
  items: Record<string, ManifestItem>
}
