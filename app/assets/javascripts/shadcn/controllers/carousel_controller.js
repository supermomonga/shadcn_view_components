import { Controller } from "@hotwired/stimulus"

// カルーセルのナビ補助(10-roadmap Phase 2「scroll-snap + ナビ補助」)。
// スクロール自体は CSS(overflow)と生のスクロール位置で行い、
// このコントローラは prev/next 操作とボタンの有効化状態の管理だけを担う
/** @extends {Controller<HTMLElement>} */
export default class CarouselController extends Controller {
  /** @type {HTMLElement | null} */
  viewport = null

  onScroll = () => this.refresh()

  connect() {
    this.viewport = /** @type {HTMLElement | null} */ (
      this.element.querySelector("[data-slot='carousel-content']")
    )
    if (this.viewport) {
      this.viewport.addEventListener("scroll", this.onScroll, { passive: true })
    }
    this.refresh()
  }

  disconnect() {
    if (this.viewport) this.viewport.removeEventListener("scroll", this.onScroll)
    this.viewport = null
  }

  scrollPrevious() {
    if (!this.viewport) return
    this.scrollBy(-this.viewport.clientWidth)
  }

  scrollNext() {
    if (!this.viewport) return
    this.scrollBy(this.viewport.clientWidth)
  }

  /** @param {number} distance */
  scrollBy(distance) {
    if (!this.viewport) return
    this.viewport.scrollBy({ left: distance, behavior: "smooth" })
  }

  refresh() {
    if (!this.viewport) return
    const previous = /** @type {HTMLButtonElement | null} */ (
      this.element.querySelector("[data-slot='carousel-previous']")
    )
    const next = /** @type {HTMLButtonElement | null} */ (
      this.element.querySelector("[data-slot='carousel-next']")
    )
    const max = this.viewport.scrollWidth - this.viewport.clientWidth
    if (previous) previous.disabled = this.viewport.scrollLeft <= 0
    if (next) next.disabled = this.viewport.scrollLeft >= max - 1
  }
}
