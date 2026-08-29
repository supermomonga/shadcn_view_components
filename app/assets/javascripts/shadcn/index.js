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
import AccordionController from "shadcn/controllers/accordion_controller"
import CarouselController from "shadcn/controllers/carousel_controller"
import CommandController from "shadcn/controllers/command_controller"
import DialogController from "shadcn/controllers/dialog_controller"
import HoverCardController from "shadcn/controllers/hover_card_controller"
import MenuController from "shadcn/controllers/menu_controller"
import MessageScrollerController from "shadcn/controllers/message_scroller_controller"
import PopoverController from "shadcn/controllers/popover_controller"
import ResizableController from "shadcn/controllers/resizable_controller"
import SidebarController from "shadcn/controllers/sidebar_controller"
import TabsController from "shadcn/controllers/tabs_controller"
import ToggleController from "shadcn/controllers/toggle_controller"
import TooltipController from "shadcn/controllers/tooltip_controller"
import ToggleGroupController from "shadcn/controllers/toggle_group_controller"
import ToastController from "shadcn/controllers/toast_controller"

export function register(application) {
  application.register("shadcn--accordion", AccordionController)
  application.register("shadcn--carousel", CarouselController)
  application.register("shadcn--command", CommandController)
  application.register("shadcn--dialog", DialogController)
  application.register("shadcn--hover-card", HoverCardController)
  application.register("shadcn--menu", MenuController)
  application.register("shadcn--message-scroller", MessageScrollerController)
  application.register("shadcn--popover", PopoverController)
  application.register("shadcn--resizable", ResizableController)
  application.register("shadcn--sidebar", SidebarController)
  application.register("shadcn--tabs", TabsController)
  application.register("shadcn--toggle", ToggleController)
  application.register("shadcn--toggle-group", ToggleGroupController)
  application.register("shadcn--tooltip", TooltipController)
  application.register("shadcn--toast", ToastController)
}
