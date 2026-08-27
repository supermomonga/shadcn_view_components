// 手書きESM(ビルドレス)。トランスパイル・バンドル・外部依存なし。
// Stimulus本体はホストのものを利用する(Application登録時に受け取る)。
//
// ホスト側での登録(importmap-rails利用時。エンジンが自動pin):
//   import { register } from "shadcn"
//   register(application)
//
// Phase 0 はインタラクティブコンポーネント未実装のため登録対象はまだ無い。
// コントローラ追加時の規約(05-stimulus-hotwire §2):
//   import DialogController from "./controllers/dialog_controller"
//   application.register("shadcn--dialog", DialogController)

export function register(application) {
  // application.register("shadcn--dialog", DialogController)
}
