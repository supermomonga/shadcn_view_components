// 手書きESM。importmapではengineのpin、bundlerでは同じdirectoryの
// package.jsonの固有名をlocal dependencyとして解決する。
// Stimulus本体はホストのものを利用する(Application登録時に受け取る)。
//
// ホスト側での登録(importmap-rails利用時。エンジンが自動pin):
//   import { register } from "@supermomonga/shadcn-view-components"
//   register(application)
//
// コントローラ規約(05-stimulus-hotwire §2):
//   識別子は shadcn--<component>、ターゲット名は data-slot と同一。
//   コントローラはSSRされたDOMの属性・クラスを変化させるだけ(構造は再構築しない)。
//
// NOTE: コントローラのimportはpackage固有名のベア指定子で統一する。
// importmap環境ではengineのpin、bundler環境ではpackageのself-referenceが解決する。
// digest付きassetとNode module resolutionのどちらでも同じentry pointを使える。
import AccordionController from "@supermomonga/shadcn-view-components/controllers/accordion_controller"
import CalendarController from "@supermomonga/shadcn-view-components/controllers/calendar_controller"
import CarouselController from "@supermomonga/shadcn-view-components/controllers/carousel_controller"
import ComboboxController from "@supermomonga/shadcn-view-components/controllers/combobox_controller"
import CommandController from "@supermomonga/shadcn-view-components/controllers/command_controller"
import DialogController from "@supermomonga/shadcn-view-components/controllers/dialog_controller"
import HoverCardController from "@supermomonga/shadcn-view-components/controllers/hover_card_controller"
import InputOTPController from "@supermomonga/shadcn-view-components/controllers/input_otp_controller"
import MenuController from "@supermomonga/shadcn-view-components/controllers/menu_controller"
import MenubarController from "@supermomonga/shadcn-view-components/controllers/menubar_controller"
import MessageScrollerController from "@supermomonga/shadcn-view-components/controllers/message_scroller_controller"
import NavigationMenuController from "@supermomonga/shadcn-view-components/controllers/navigation_menu_controller"
import PopoverController from "@supermomonga/shadcn-view-components/controllers/popover_controller"
import ResizableController from "@supermomonga/shadcn-view-components/controllers/resizable_controller"
import SelectController from "@supermomonga/shadcn-view-components/controllers/select_controller"
import SidebarController from "@supermomonga/shadcn-view-components/controllers/sidebar_controller"
import SliderController from "@supermomonga/shadcn-view-components/controllers/slider_controller"
import TabsController from "@supermomonga/shadcn-view-components/controllers/tabs_controller"
import ToggleController from "@supermomonga/shadcn-view-components/controllers/toggle_controller"
import TooltipController from "@supermomonga/shadcn-view-components/controllers/tooltip_controller"
import ToggleGroupController from "@supermomonga/shadcn-view-components/controllers/toggle_group_controller"
import ToastController from "@supermomonga/shadcn-view-components/controllers/toast_controller"

/** @param {import("@hotwired/stimulus").Application} application */
export function register(application) {
  application.register("shadcn--accordion", AccordionController)
  application.register("shadcn--calendar", CalendarController)
  application.register("shadcn--carousel", CarouselController)
  application.register("shadcn--combobox", ComboboxController)
  application.register("shadcn--command", CommandController)
  application.register("shadcn--dialog", DialogController)
  application.register("shadcn--hover-card", HoverCardController)
  application.register("shadcn--input-otp", InputOTPController)
  application.register("shadcn--menu", MenuController)
  application.register("shadcn--menubar", MenubarController)
  application.register("shadcn--message-scroller", MessageScrollerController)
  application.register("shadcn--navigation-menu", NavigationMenuController)
  application.register("shadcn--popover", PopoverController)
  application.register("shadcn--resizable", ResizableController)
  application.register("shadcn--select", SelectController)
  application.register("shadcn--sidebar", SidebarController)
  application.register("shadcn--slider", SliderController)
  application.register("shadcn--tabs", TabsController)
  application.register("shadcn--toggle", ToggleController)
  application.register("shadcn--toggle-group", ToggleGroupController)
  application.register("shadcn--tooltip", TooltipController)
  application.register("shadcn--toast", ToastController)
}
