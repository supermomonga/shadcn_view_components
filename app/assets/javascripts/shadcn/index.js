// 手書きESM(ビルドレス)。トランスパイル・バンドル・外部依存なし。
// Stimulus本体はホストのものを利用する(Application登録時に受け取る)。
//
// ホスト側での登録(importmap-rails利用時。エンジンが自動pin):
//   import { register } from "shadcn"
//   register(application)
//
// コントローラ規約(05-stimulus-hotwire §2):
//   識別子は shadcn--<component>、ターゲット名は data-slot と同一。
//   コントローラはSSRされたDOMの属性・クラスを変化させるだけ(構造は再構築しない)。
//
// NOTE: コントローラのimportは pin名("shadcn/...")のベア指定子で行う。
// importmap環境ではdigest付きパス配下の相対importが解決できないため。
// importmap非利用のホストは、本ファイルではなく各コントローラを直接importして
// application.register すること(READMEのフォールバック手順参照)
import CarouselController from "shadcn/controllers/carousel_controller"
import TabsController from "shadcn/controllers/tabs_controller"
import ToggleController from "shadcn/controllers/toggle_controller"
import ToggleGroupController from "shadcn/controllers/toggle_group_controller"

export function register(application) {
  application.register("shadcn--carousel", CarouselController)
  application.register("shadcn--tabs", TabsController)
  application.register("shadcn--toggle", ToggleController)
  application.register("shadcn--toggle-group", ToggleGroupController)
}
