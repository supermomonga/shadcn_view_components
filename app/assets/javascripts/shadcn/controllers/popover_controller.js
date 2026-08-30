import { Controller } from "@hotwired/stimulus"

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

  /** @type {() => void} */
  onToggle = () => this.syncState()

  connect() {
    this.cancelPendingExit()
    this.content = this.element.querySelector("[popover]")
    this.trigger = this.element.querySelector("[data-slot='popover-trigger']")
    this.content?.addEventListener("toggle", this.onToggle)
    this.syncState()
  }

  disconnect() {
    const content = this.content
    const finishExit = content?.dataset.state === "closed" && content.matches(":popover-open")
    this.cancelPendingExit()
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
        content.hidePopover()
      })
      return
    }

    this.cancelPendingExit()
    this.applyState("open")
    if (!content.matches(":popover-open")) content.showPopover()
    this.position()
  }

  syncState() {
    const content = this.content
    if (!content) return

    const state = content.matches(":popover-open") ? "open" : "closed"
    if (state === "open") this.cancelPendingExit()
    this.applyState(state)
    if (state === "open") this.position()
  }

  /** @param {"open" | "closed"} state */
  applyState(state) {
    if (!this.content) return

    this.content.dataset.state = state
    applyStateAttrs(this.content, state)
    this.trigger?.setAttribute("aria-expanded", String(state === "open"))
  }

  // align=center / sideOffset 既定(下方向)の位置合わせ。
  // anchor positioning 非対応環境でも成立するよう JS で算出する
  position() {
    const content = this.content
    const trigger = this.trigger
    if (!content || !trigger) return

    content.dataset.side = "bottom"
    const rect = trigger.getBoundingClientRect()
    const offset = Number(content.dataset.sideOffset ?? 4)
    const style = content.style
    style.position = "fixed"
    style.margin = "0"
    const left = rect.left + rect.width / 2 - content.offsetWidth / 2
    style.left = `${Math.max(8, Math.min(left, window.innerWidth - content.offsetWidth - 8))}px`
    style.top = `${rect.bottom + offset}px`
  }

  cancelPendingExit() {
    this.cancelExit()
    this.cancelExit = noop
  }
}
