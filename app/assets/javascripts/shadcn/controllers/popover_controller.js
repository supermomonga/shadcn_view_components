import { Controller } from "@hotwired/stimulus"

import { startFloatingPosition } from "@supermomonga/shadcn-view-components/floating_position"
import { hideAfterExit } from "@supermomonga/shadcn-view-components/hide_after_exit"
import { applyStateAttrs } from "@supermomonga/shadcn-view-components/state_attrs"

const noop = () => {}

// Popover API(popover="auto")の開閉同期と位置合わせ。
// 軽い外側クリック解散(light dismiss)はネイティブが担い、ここでは
// data-state / aria-expanded の同期と、trigger 直下への位置合わせを行う。
// trigger からの明示的な閉じ操作では退出アニメーションを待つ
// (ネイティブの light dismiss は即時解散のためアニメーション無し)
export default class PopoverController extends Controller {
  /** @type {HTMLElement | null} */
  content = null

  /** @type {HTMLElement | null} */
  trigger = null

  /** @type {() => void} */
  cancelExit = noop

  /** @type {{ update: () => void, destroy: () => void } | null} */
  positioning = null

  /** @type {() => void} */
  onToggle = () => this.syncState()

  connect() {
    this.cancelPendingExit()
    this.stopPositioning()
    this.content = this.element.querySelector("[popover]")
    this.trigger = this.element.querySelector("[data-slot='popover-trigger']")
    this.content?.addEventListener("toggle", this.onToggle)
    this.syncState()
  }

  disconnect() {
    const content = this.content
    const finishExit = content?.dataset.state === "closed" && content.matches(":popover-open")
    this.cancelPendingExit()
    this.stopPositioning()
    content?.removeEventListener("toggle", this.onToggle)
    if (finishExit) content.hidePopover()
    this.content = null
    this.trigger = null
  }

  toggle() {
    const content = this.content
    if (!content) return

    const exiting = content.dataset.state === "closed" && content.matches(":popover-open")
    if (content.matches(":popover-open") && !exiting) {
      this.cancelPendingExit()
      this.applyState("closed")
      this.cancelExit = hideAfterExit(content, () => {
        if (this.content !== content || content.dataset.state === "open") return
        this.stopPositioning()
        content.hidePopover()
      })
      return
    }

    this.cancelPendingExit()
    this.applyState("open")
    if (!content.matches(":popover-open")) content.showPopover()
    this.startPositioning()
  }

  syncState() {
    const content = this.content
    if (!content) return

    const state = content.matches(":popover-open") ? "open" : "closed"
    if (state === "open") this.cancelPendingExit()
    this.applyState(state)
    if (state === "open") this.startPositioning()
    else this.stopPositioning()
  }

  /** @param {"open" | "closed"} state */
  applyState(state) {
    if (!this.content) return

    this.content.dataset.state = state
    applyStateAttrs(this.content, state)
    this.trigger?.setAttribute("aria-expanded", String(state === "open"))
  }

  startPositioning() {
    const content = this.content
    const trigger = this.trigger
    if (!content || !trigger) return

    this.stopPositioning()
    this.positioning = startFloatingPosition({
      align: "center",
      anchor: trigger,
      collisionPadding: 5,
      floating: content,
      side: "bottom",
      sideOffset: 4,
    })
  }

  stopPositioning() {
    this.positioning?.destroy()
    this.positioning = null
  }

  cancelPendingExit() {
    this.cancelExit()
    this.cancelExit = noop
  }
}
