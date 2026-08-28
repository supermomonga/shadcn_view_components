import { Controller } from "@hotwired/stimulus"

// コマンドパレット / コンボボックスの絞り込み(10-roadmap Phase 3)。
// SSR済みの項目リストを入力でフィルタし、矢印キーでハイライト移動、
// Enter で選択(data-selected / data-state を書き換える)
export default class CommandController extends Controller {
  connect() {
    this.input = this.element.querySelector("input[role='combobox']") ||
      this.element.querySelector("[data-slot='command-input']")
    this.empty = this.element.querySelector("[data-slot='command-empty'], [data-slot='combobox-empty']")
    this.onKeydown = (event) => this.navigate(event)
    this.element.addEventListener("keydown", this.onKeydown, true)
    this.filter()
  }

  disconnect() {
    this.element.removeEventListener("keydown", this.onKeydown, true)
  }

  get items() {
    return [...this.element.querySelectorAll("[data-slot='command-item'], [data-slot='combobox-item']")]
  }

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
    // 空グループも畳む
    for (const group of this.element.querySelectorAll("[data-slot='command-group'], [data-slot='combobox-group']")) {
      group.hidden = [...group.querySelectorAll("[data-slot$='-item']")].every((item) => item.hidden)
    }
    if (this.empty) this.empty.hidden = visible > 0
    this.highlight(this.visibleItems[0])
  }

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

  highlight(item) {
    // 非表示項目も含めて走査する(絞り込みで隠れた項目に選択状態が残留しないように)
    for (const candidate of this.items) {
      const selected = candidate === item
      candidate.dataset.selected = selected ? "true" : "false"
      if (selected) candidate.setAttribute("aria-selected", "true")
      else candidate.removeAttribute("aria-selected")
    }
  }

  // combobox: トリガーアイコンでリストを開閉する
  toggleList(event) {
    const list = this.element.querySelector("[popover]")
    if (list) list.togglePopover()
  }
}
