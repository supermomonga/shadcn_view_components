import { Controller } from "@hotwired/stimulus"

// カルーセルのナビ補助(10-roadmap Phase 2「scroll-snap + ナビ補助」)。
// スクロール自体は CSS(overflow)と生のスクロール位置で行い、
// このコントローラは prev/next 操作とボタンの有効化状態の管理だけを担う
export default class CarouselController extends Controller {
  connect() {
    this.viewport = this.element.querySelector("[data-slot='carousel-content']")
    this.onScroll = () => this.refresh()
    if (this.viewport) {
      this.viewport.addEventListener("scroll", this.onScroll, { passive: true })
    }
    this.refresh()
  }

  disconnect() {
    if (this.viewport) this.viewport.removeEventListener("scroll", this.onScroll)
  }

  scrollPrevious() {
    this.scrollBy(-this.viewport.clientWidth)
  }

  scrollNext() {
    this.scrollBy(this.viewport.clientWidth)
  }

  scrollBy(distance) {
    if (!this.viewport) return
    this.viewport.scrollBy({ left: distance, behavior: "smooth" })
  }

  refresh() {
    if (!this.viewport) return
    const previous = this.element.querySelector("[data-slot='carousel-previous']")
    const next = this.element.querySelector("[data-slot='carousel-next']")
    const max = this.viewport.scrollWidth - this.viewport.clientWidth
    if (previous) previous.disabled = this.viewport.scrollLeft <= 0
    if (next) next.disabled = this.viewport.scrollLeft >= max - 1
  }
}
