import { Controller } from "@hotwired/stimulus"

// サイドバーの開閉(10-roadmap Phase 4)。
// 状態は Provider の data-state(open/closed)のみ。Turboキャッシュ復帰時は
// 属性がDOMごと戻るため、connect での再初期化は不要(冪等 — 05 §6.2)
export default class SidebarController extends Controller {
  toggle() {
    const state = this.element.dataset.state === "open" ? "closed" : "open"
    this.element.dataset.state = state
    for (const sidebar of this.element.querySelectorAll("[data-slot='sidebar']")) {
      sidebar.dataset.state = state
    }
    for (const trigger of this.element.querySelectorAll("[data-slot='sidebar-trigger']")) {
      trigger.setAttribute("aria-expanded", String(state === "open"))
    }
  }
}
