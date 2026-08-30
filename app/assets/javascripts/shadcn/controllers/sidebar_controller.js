import { Controller } from "@hotwired/stimulus"

// サイドバーの開閉(10-roadmap Phase 4)。
// Provider の data-state(open/closed)を正とし、接続・再接続時に子要素と
// aria-expandedを冪等に同期する(Turbo cache復帰を含む — 05 §6.2)。
/** @extends {Controller<HTMLElement>} */
export default class SidebarController extends Controller {
  connect() {
    this.setState(this.element.dataset.state === "open" ? "open" : "closed")
  }

  toggle() {
    const state = this.element.dataset.state === "open" ? "closed" : "open"
    this.setState(state)
  }

  /** @param {"open" | "closed"} state */
  setState(state) {
    this.element.dataset.state = state
    const sidebars = /** @type {NodeListOf<HTMLElement>} */ (
      this.element.querySelectorAll("[data-slot='sidebar']")
    )
    for (const sidebar of sidebars) {
      sidebar.dataset.state = state
    }
    for (const trigger of this.element.querySelectorAll("[data-slot='sidebar-trigger']")) {
      trigger.setAttribute("aria-expanded", String(state === "open"))
    }
  }
}
