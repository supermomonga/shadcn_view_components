import { Controller } from "@hotwired/stimulus"

// メッセージスクロール領域の追従と「一番下へ」ボタン(Phase 4)
export default class MessageScrollerController extends Controller {
  connect() {
    this.viewport = this.element.querySelector("[data-slot='message-scroller-viewport']")
    this.onScroll = () => this.refresh()
    this.viewport?.addEventListener("scroll", this.onScroll, { passive: true })
    this.refresh()
  }

  disconnect() {
    this.viewport?.removeEventListener("scroll", this.onScroll)
  }

  scrollToBottom() {
    this.viewport?.scrollTo({ top: this.viewport.scrollHeight, behavior: "smooth" })
  }

  refresh() {
    if (!this.viewport) return
    const button = this.element.querySelector("[data-slot='message-scroller-button']")
    if (!button) return
    const distance = this.viewport.scrollHeight - this.viewport.scrollTop - this.viewport.clientHeight
    button.hidden = distance < 24
  }
}
