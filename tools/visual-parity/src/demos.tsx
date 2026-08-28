/**
 * upstream デモ集の統合エントリ。`?demo=<id>` は main.tsx がここから解決する。
 * デモの追加は demos-a-to-m.tsx / demos-n-to-z.tsx に行い、
 * spec/visual/parity_spec.rb の SCENARIOS にも対応する1行を登録する。
 */
import { demosAToM } from "./demos-a-to-m.tsx"
import { demosNToZ } from "./demos-n-to-z.tsx"

export const demos = { ...demosAToM, ...demosNToZ }
