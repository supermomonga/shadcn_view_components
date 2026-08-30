import { Controller } from "@hotwired/stimulus"

import { hideAfterExit } from "@supermomonga/shadcn-view-components/hide_after_exit"
import { applyStateAttrs } from "@supermomonga/shadcn-view-components/state_attrs"

const noop = () => {}

// ツールチップの遅延制御(既定 delayDuration=0 — upstream と同じ)。
// aria-describedby で trigger と内容を結合する(05 §4)。
// 閉じる際は退出アニメーション(data-[state=closed]:animate-out)を待ってから
// hidden 属性を付ける(即時 hidden にするとアニメーションが見えない)
export default class TooltipController extends Controller {
  /** @type {HTMLElement | null} */
  content = null

  /** @type {HTMLElement | null} */
  trigger = null

  /** @type {ReturnType<typeof setTimeout> | undefined} */
  showTimer

  /** @type {() => void} */
  cancelExit = noop

  connect() {
    this.cancelPendingWork()
    this.content = this.element.querySelector("[data-slot='tooltip-content']")
    this.trigger = this.element.querySelector("[data-slot='tooltip-trigger']")
    if (this.content?.id && this.trigger) this.trigger.setAttribute("aria-describedby", this.content.id)
  }

  disconnect() {
    const content = this.content
    const finishExit = content?.dataset.state === "closed" && !content.hidden
    this.cancelPendingWork()
    if (finishExit) content.hidden = true
    this.content = null
    this.trigger = null
  }

  show() {
    this.cancelPendingExit()
    if (!this.content || this.content.dataset.state === "open") return

    this.clearShowTimer()
    const content = this.content
    this.showTimer = setTimeout(() => {
      this.showTimer = undefined
      if (this.content === content) this.setState("open")
    }, 0)
  }

  hide() {
    this.clearShowTimer()
    const content = this.content
    if (!content || content.hidden || content.dataset.state === "closed") return

    this.cancelPendingExit()
    content.dataset.state = "closed"
    applyStateAttrs(content, "closed")
    this.cancelExit = hideAfterExit(content, () => {
      if (this.content !== content || content.dataset.state === "open") return
      content.hidden = true
    })
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
      const rect = this.trigger.getBoundingClientRect()
      const style = content.style
      style.position = "fixed"
      style.margin = "0"
      const left = rect.left + rect.width / 2 - content.offsetWidth / 2
      style.left = `${Math.max(8, Math.min(left, window.innerWidth - content.offsetWidth - 8))}px`
      // 上側に置くのが既定(upstream と同じ side=top)。上端と衝突する場合は
      // upstream(Radix)と同じく下側へ反転させ、data-side も実際の配置に合わせる
      if (rect.top - content.offsetHeight - 4 >= 0) {
        content.dataset.side = "top"
        style.top = `${rect.top - content.offsetHeight - 4}px`
      } else {
        content.dataset.side = "bottom"
        style.top = `${rect.bottom + 4}px`
      }
    }
  }

  clearShowTimer() {
    if (this.showTimer === undefined) return
    clearTimeout(this.showTimer)
    this.showTimer = undefined
  }

  cancelPendingExit() {
    this.cancelExit()
    this.cancelExit = noop
  }

  cancelPendingWork() {
    this.clearShowTimer()
    this.cancelPendingExit()
  }
}
