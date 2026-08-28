/**
 * upstream パリティ参照ページ。
 * `?demo=<id>` で demos.tsx の該当デモを描画する。
 * デモの内容(テキスト・props・並び)は dummy 側の Lookbook プレビュー
 * (spec/dummy/app/components/previews/shadcn/*_preview.rb)と1:1に対応させる。
 */
import { StrictMode } from "react"
import { createRoot } from "react-dom/client"

import { demos } from "./demos.tsx"
import "./theme.css"

const id = new URLSearchParams(window.location.search).get("demo") ?? ""
const Demo = demos[id]

if (!Demo) {
  document.getElementById("root")!.textContent = `unknown demo: ${id}`
} else {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <Demo />
    </StrictMode>,
  )
}
