import { Controller } from "@hotwired/stimulus"

// ARIA tabs パターン(05-stimulus-hotwire §4)。
// - クリック / Enter / Space で選択
// - 左右(縦布局は上下)矢印で roving tabindex による移動
// - 選択状態は data-active(属性の存在)、パネル表示は hidden 属性で表現する
/** @extends {Controller<HTMLElement>} */
export default class TabsController extends Controller {
  connect() {
    const triggers = this.triggers
    if (triggers.length === 0) return
    // サーバ側で active 指定があればそれを、無ければ先頭を採用してパネル表示を同期する
    const active = triggers.find((trigger) => trigger.hasAttribute("data-active")) || triggers[0]
    this.activate(active)
  }

  /** @param {Event} event */
  select(event) {
    this.activate(/** @type {HTMLElement} */ (event.currentTarget))
  }

  /** @param {KeyboardEvent} event */
  navigate(event) {
    const keys = this.vertical ? ["ArrowUp", "ArrowDown"] : ["ArrowLeft", "ArrowRight"]
    if (!keys.includes(event.key)) return
    event.preventDefault()

    const triggers = this.triggers
    const current = triggers.indexOf(/** @type {HTMLElement} */ (event.currentTarget))
    const offset = event.key === keys[1] ? 1 : -1
    const next = triggers[(current + offset + triggers.length) % triggers.length]
    next.focus()
    this.activate(next)
  }

  /** @param {HTMLElement} selected */
  activate(selected) {
    for (const trigger of this.triggers) {
      const active = trigger === selected
      trigger.toggleAttribute("data-active", active)
      trigger.setAttribute("aria-selected", String(active))
      trigger.tabIndex = active ? 0 : -1
    }

    const value = selected.dataset.value
    for (const panel of this.panels) {
      panel.hidden = value !== undefined && panel.dataset.value !== value
    }
  }

  /** @returns {HTMLElement[]} */
  get triggers() {
    /** @type {NodeListOf<HTMLElement>} */
    const triggers = this.element.querySelectorAll("[data-slot='tabs-trigger'][role='tab']")
    return [...triggers]
  }

  /** @returns {HTMLElement[]} */
  get panels() {
    /** @type {NodeListOf<HTMLElement>} */
    const panels = this.element.querySelectorAll("[data-slot='tabs-content'][role='tabpanel']")
    return [...panels]
  }

  /** @returns {boolean} */
  get vertical() {
    return this.element.dataset.orientation === "vertical"
  }
}
