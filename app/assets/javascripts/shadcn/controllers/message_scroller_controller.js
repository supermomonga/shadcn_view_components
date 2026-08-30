import { Controller } from "@hotwired/stimulus"

// メッセージスクロール領域の追従と「一番下へ」ボタン(Phase 4)
/** @extends {Controller<HTMLElement>} */
export default class MessageScrollerController extends Controller {
  /** @type {HTMLElement | null} */
  viewport = null

  onScroll = () => this.refresh()

  connect() {
    this.viewport = /** @type {HTMLElement | null} */ (
      this.element.querySelector("[data-slot='message-scroller-viewport']")
    )
    this.viewport?.addEventListener("scroll", this.onScroll, { passive: true })
    this.refresh()
  }

  disconnect() {
    this.viewport?.removeEventListener("scroll", this.onScroll)
    this.viewport = null
  }

  scrollToBottom() {
    this.viewport?.scrollTo({ top: this.viewport.scrollHeight, behavior: "smooth" })
  }

  refresh() {
    if (!this.viewport) return
    const button = /** @type {HTMLButtonElement | null} */ (
      this.element.querySelector("[data-slot='message-scroller-button']")
    )
    if (!button) return
    const distance = this.viewport.scrollHeight - this.viewport.scrollTop - this.viewport.clientHeight
    button.hidden = distance < 24
  }
}
