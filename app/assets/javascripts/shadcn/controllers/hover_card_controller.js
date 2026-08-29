import { Controller } from "@hotwired/stimulus"

import { hideAfterExit } from "shadcn/hide_after_exit"

// ホバーインテント: trigger と content のどちらにいるかを遅延つきで判定し、
// 素早い通り抜けでは表示しない(05-stimulus-hotwire §3)。
// 閉じる際は退出アニメーション(data-[state=closed]:animate-out)を待ってから
// hidden 属性を付ける
export default class HoverCardController extends Controller {
  connect() {
    this.content = this.element.querySelector("[data-slot='hover-card-content']")
    this.trigger = this.element.querySelector("[data-slot='hover-card-trigger']")
  }

  disconnect() {
    clearTimeout(this.showTimer)
    clearTimeout(this.hideTimer)
  }

  show() {
    clearTimeout(this.hideTimer)
    if (!this.content || this.content.dataset.state === "open") return
    clearTimeout(this.showTimer)
    this.showTimer = setTimeout(() => this.setState("open"), 100)
  }

  hide() {
    clearTimeout(this.showTimer)
    if (!this.content || this.content.dataset.state === "closed") return
    this.hideTimer = setTimeout(() => {
      this.content.dataset.state = "closed"
      hideAfterExit(this.content, () => {
        if (this.content?.dataset.state === "open") return
        this.content.hidden = true
      })
    }, 150)
  }

  setState(state) {
    if (!this.content) return
    this.content.dataset.state = state
    this.content.hidden = state === "closed"
    if (state === "open" && this.trigger) {
      this.content.dataset.side = "bottom"
      const rect = this.trigger.getBoundingClientRect()
      const style = this.content.style
      style.position = "fixed"
      style.margin = "0"
      const left = rect.left + rect.width / 2 - this.content.offsetWidth / 2
      style.left = `${Math.max(8, Math.min(left, window.innerWidth - this.content.offsetWidth - 8))}px`
      style.top = `${rect.bottom + 4}px`
    }
  }
}
