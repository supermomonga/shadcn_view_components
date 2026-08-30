import { Controller } from "@hotwired/stimulus"

import { startFloatingPosition } from "@supermomonga/shadcn-view-components/floating_position"
import { hideAfterExit } from "@supermomonga/shadcn-view-components/hide_after_exit"
import { applyStateAttrs } from "@supermomonga/shadcn-view-components/state_attrs"

const noop = () => {}

// ホバーインテント: trigger と content のどちらにいるかを遅延つきで判定し、
// 素早い通り抜けでは表示しない(05-stimulus-hotwire §3)。
// 閉じる際は退出アニメーション(data-[state=closed]:animate-out)を待ってから
// hidden 属性を付ける
export default class HoverCardController extends Controller {
  /** @type {HTMLElement | null} */
  content = null

  /** @type {HTMLElement | null} */
  trigger = null

  /** @type {ReturnType<typeof setTimeout> | undefined} */
  showTimer

  /** @type {ReturnType<typeof setTimeout> | undefined} */
  hideTimer

  /** @type {() => void} */
  cancelExit = noop

  /** @type {{ update: () => void, destroy: () => void } | null} */
  positioning = null

  connect() {
    this.cancelPendingWork()
    this.stopPositioning()
    this.content = this.element.querySelector("[data-slot='hover-card-content']")
    this.trigger = this.element.querySelector("[data-slot='hover-card-trigger']")
  }

  disconnect() {
    const content = this.content
    const finishHide = this.hideTimer !== undefined
    const finishExit = content?.dataset.state === "closed" && !content.hidden
    this.cancelPendingWork()
    this.stopPositioning()
    if (content && (finishHide || finishExit)) {
      content.dataset.state = "closed"
      applyStateAttrs(content, "closed")
      content.hidden = true
    }
    this.content = null
    this.trigger = null
  }

  show() {
    this.clearHideTimer()
    this.cancelPendingExit()
    if (!this.content || this.content.dataset.state === "open") return

    this.clearShowTimer()
    const content = this.content
    this.showTimer = setTimeout(() => {
      this.showTimer = undefined
      if (this.content === content) this.setState("open")
    }, 100)
  }

  hide() {
    this.clearShowTimer()
    if (!this.content || this.content.dataset.state === "closed") return

    this.clearHideTimer()
    const content = this.content
    this.hideTimer = setTimeout(() => {
      this.hideTimer = undefined
      if (this.content !== content) return

      content.dataset.state = "closed"
      applyStateAttrs(content, "closed")
      this.cancelPendingExit()
      this.cancelExit = hideAfterExit(content, () => {
        if (this.content !== content || content.dataset.state === "open") return
        this.stopPositioning()
        content.hidden = true
      })
    }, 150)
  }

  /** @param {"open" | "closed"} state */
  setState(state) {
    const content = this.content
    if (!content) return
    if (state === "open") this.cancelPendingExit()

    content.dataset.state = state
    applyStateAttrs(content, state)
    content.hidden = state === "closed"
    if (state === "open") this.startPositioning()
    else this.stopPositioning()
  }

  startPositioning() {
    const content = this.content
    const trigger = this.trigger
    if (!content || !trigger) return

    this.stopPositioning()
    this.positioning = startFloatingPosition({
      align: "center",
      alignOffset: 4,
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

  clearShowTimer() {
    if (this.showTimer === undefined) return
    clearTimeout(this.showTimer)
    this.showTimer = undefined
  }

  clearHideTimer() {
    if (this.hideTimer === undefined) return
    clearTimeout(this.hideTimer)
    this.hideTimer = undefined
  }

  cancelPendingExit() {
    this.cancelExit()
    this.cancelExit = noop
  }

  cancelPendingWork() {
    this.clearShowTimer()
    this.clearHideTimer()
    this.cancelPendingExit()
  }
}
