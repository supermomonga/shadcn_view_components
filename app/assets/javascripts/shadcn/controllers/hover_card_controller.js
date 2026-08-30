import { Controller } from "@hotwired/stimulus"

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

  connect() {
    this.cancelPendingWork()
    this.content = this.element.querySelector("[data-slot='hover-card-content']")
    this.trigger = this.element.querySelector("[data-slot='hover-card-trigger']")
  }

  disconnect() {
    const content = this.content
    const finishHide = this.hideTimer !== undefined
    const finishExit = content?.dataset.state === "closed" && !content.hidden
    this.cancelPendingWork()
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
    if (state === "open" && this.trigger) {
      content.dataset.side = "bottom"
      const rect = this.trigger.getBoundingClientRect()
      const style = content.style
      style.position = "fixed"
      style.margin = "0"
      const left = rect.left + rect.width / 2 - content.offsetWidth / 2
      style.left = `${Math.max(8, Math.min(left, window.innerWidth - content.offsetWidth - 8))}px`
      style.top = `${rect.bottom + 4}px`
    }
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
