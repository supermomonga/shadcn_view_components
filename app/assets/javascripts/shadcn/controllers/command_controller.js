import { Controller } from "@hotwired/stimulus"

// SSR済みのCommand項目を検索文字列で絞り込み、キーボード上のハイライトを管理する。
// Comboboxの確定値とフォーム連携は専用controllerが担当する。
/** @extends {Controller<HTMLElement>} */
export default class CommandController extends Controller {
  /** @type {(event: KeyboardEvent) => void} */
  onKeydown = (event) => this.navigate(event)

  connect() {
    /** @type {HTMLInputElement | null} */
    this.input = this.element.querySelector("[data-slot='command-input']")
    /** @type {HTMLElement | null} */
    this.empty = this.element.querySelector("[data-slot='command-empty']")
    this.element.addEventListener("keydown", this.onKeydown, true)
    this.filter()
  }

  disconnect() {
    this.element.removeEventListener("keydown", this.onKeydown, true)
  }

  /** @returns {HTMLElement[]} */
  get items() {
    /** @type {NodeListOf<HTMLElement>} */
    const items = this.element.querySelectorAll("[data-slot='command-item']")
    return [...items]
  }

  /** @returns {HTMLElement[]} */
  get visibleItems() {
    return this.items.filter((item) => !item.hidden)
  }

  filter() {
    if (!this.input) return
    const query = this.input.value.trim().toLowerCase()
    let visible = 0
    for (const item of this.items) {
      const text = `${item.dataset.value ?? ""} ${item.textContent}`.toLowerCase()
      const match = query === "" || text.includes(query)
      item.hidden = !match
      if (match) visible += 1
    }

    /** @type {NodeListOf<HTMLElement>} */
    const groups = this.element.querySelectorAll("[data-slot='command-group']")
    for (const group of groups) {
      /** @type {NodeListOf<HTMLElement>} */
      const groupItems = group.querySelectorAll("[data-slot='command-item']")
      group.hidden = [...groupItems].every((item) => item.hidden)
    }
    if (this.empty) this.empty.hidden = visible > 0
    this.highlight(this.visibleItems[0])
  }

  /** @param {KeyboardEvent} event */
  navigate(event) {
    const keys = ["ArrowDown", "ArrowUp", "Enter", "Home", "End"]
    if (!keys.includes(event.key)) return
    const items = this.visibleItems
    if (items.length === 0) return
    event.preventDefault()

    if (event.key === "Enter") {
      items.find((item) => item.dataset.selected === "true")?.click()
      return
    }
    const current = items.findIndex((item) => item.dataset.selected === "true")
    let next = current
    if (event.key === "ArrowDown") next = (current + 1 + items.length) % items.length
    if (event.key === "ArrowUp") next = (current - 1 + items.length) % items.length
    if (event.key === "Home") next = 0
    if (event.key === "End") next = items.length - 1
    this.highlight(items[Math.max(0, next)])
  }

  /** @param {HTMLElement | undefined} item */
  highlight(item) {
    for (const candidate of this.items) {
      const selected = candidate === item
      candidate.dataset.selected = selected ? "true" : "false"
      if (selected) candidate.setAttribute("aria-selected", "true")
      else candidate.removeAttribute("aria-selected")
    }
  }
}
