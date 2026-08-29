import { Controller } from "@hotwired/stimulus"

import { hideAfterExit } from "shadcn/hide_after_exit"

// ツールチップの遅延制御(既定 delayDuration=0 — upstream と同じ)。
// aria-describedby で trigger と内容を結合する(05 §4)。
// 閉じる際は退出アニメーション(data-[state=closed]:animate-out)を待ってから
// hidden 属性を付ける(即時 hidden にするとアニメーションが見えない)
export default class TooltipController extends Controller {
  connect() {
    this.content = this.element.querySelector("[data-slot='tooltip-content']")
    this.trigger = this.element.querySelector("[data-slot='tooltip-trigger']")
    if (this.content?.id && this.trigger) {
      this.trigger.setAttribute("aria-describedby", this.content.id)
    }
  }

  disconnect() {
    clearTimeout(this.showTimer)
  }

  show() {
    if (!this.content || this.content.dataset.state === "open") return
    clearTimeout(this.showTimer)
    this.showTimer = setTimeout(() => this.setState("open"), 0)
  }

  hide() {
    clearTimeout(this.showTimer)
    if (!this.content || this.content.hidden || this.content.dataset.state === "closed") return

    this.content.dataset.state = "closed"
    hideAfterExit(this.content, () => {
      if (this.content?.dataset.state === "open") return
      this.content.hidden = true
    })
  }

  setState(state) {
    if (!this.content) return
    this.content.dataset.state = state
    this.content.hidden = state === "closed"
    if (state === "open" && this.trigger) {
      const rect = this.trigger.getBoundingClientRect()
      const style = this.content.style
      style.position = "fixed"
      style.margin = "0"
      const left = rect.left + rect.width / 2 - this.content.offsetWidth / 2
      style.left = `${Math.max(8, Math.min(left, window.innerWidth - this.content.offsetWidth - 8))}px`
      style.top = `${rect.top - this.content.offsetHeight - 4}px`
    }
  }
}
