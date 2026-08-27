import { Controller } from "@hotwired/stimulus"

// ARIA tabs パターン(05-stimulus-hotwire §4)。
// - クリック / Enter / Space で選択
// - 左右(縦布局は上下)矢印で roving tabindex による移動
// - 選択状態は data-state、パネル表示は hidden 属性で表現する
export default class TabsController extends Controller {
  connect() {
    const triggers = this.triggers
    if (triggers.length === 0) return
    // サーバ側で active 指定があればそれを、無ければ先頭を採用してパネル表示を同期する
    const active = triggers.find((trigger) => trigger.dataset.state === "active") || triggers[0]
    this.activate(active)
  }

  select(event) {
    this.activate(event.currentTarget)
  }

  navigate(event) {
    const keys = this.vertical ? ["ArrowUp", "ArrowDown"] : ["ArrowLeft", "ArrowRight"]
    if (!keys.includes(event.key)) return
    event.preventDefault()

    const triggers = this.triggers
    const current = triggers.indexOf(event.currentTarget)
    const offset = event.key === keys[1] ? 1 : -1
    const next = triggers[(current + offset + triggers.length) % triggers.length]
    next.focus()
    this.activate(next)
  }

  activate(selected) {
    for (const trigger of this.triggers) {
      const active = trigger === selected
      trigger.dataset.state = active ? "active" : "inactive"
      trigger.setAttribute("aria-selected", String(active))
      trigger.tabIndex = active ? 0 : -1
    }

    const value = selected.dataset.value
    for (const panel of this.panels) {
      panel.hidden = value !== undefined && panel.dataset.value !== value
    }
  }

  get triggers() {
    return [...this.element.querySelectorAll("[data-slot='tabs-trigger'][role='tab']")]
  }

  get panels() {
    return [...this.element.querySelectorAll("[data-slot='tabs-content'][role='tabpanel']")]
  }

  get vertical() {
    return this.element.dataset.orientation === "vertical"
  }
}
