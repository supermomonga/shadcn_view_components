import { Controller } from "@hotwired/stimulus"

import { hideAfterExit } from "shadcn/hide_after_exit"

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
    // combobox のリスト(popover)は data-open / data-closed 属性でアニメーション
    // (upstream の Base UI と同じ属性)するため、開閉に同期して切り替える
    this.list = this.element.querySelector("[popover]")
    if (this.list) {
      this.onListToggle = () => this.syncListState()
      this.list.addEventListener("toggle", this.onListToggle)
      this.syncListState()
    }
    this.filter()
  }

  disconnect() {
    this.element.removeEventListener("keydown", this.onKeydown, true)
    this.list?.removeEventListener("toggle", this.onListToggle)
  }

  // open 引数を渡すと実開状態より優先する(表示前に属性を切り替えるため)
  syncListState(open = this.list?.matches(":popover-open")) {
    if (!this.list) return
    this.list.dataset.state = open ? "open" : "closed"
    if (open) this.list.dataset.side = "bottom"
    if (open) {
      this.list.setAttribute("data-open", "")
      this.list.removeAttribute("data-closed")
    } else {
      this.list.setAttribute("data-closed", "")
      this.list.removeAttribute("data-open")
    }
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

  // combobox: トリガーアイコンでリストを開閉する。
  // popover の toggle イベントは非同期のため、表示前に属性を先に切り替える
  // (閉状態属性のまま表示され、exit アニメーションで始まってしまうのを防ぐ)
  toggleList(event) {
    const list = this.element.querySelector("[popover]")
    if (!list) return
    if (list.matches(":popover-open")) {
      this.syncListState(false)
      hideAfterExit(list, () => {
        if (list.dataset.state === "open") return
        list.hidePopover()
      })
    } else {
      this.syncListState(true)
      list.showPopover()
    }
  }
}
