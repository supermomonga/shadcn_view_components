import { Controller } from "@hotwired/stimulus"

import { hideAfterExit } from "@supermomonga/shadcn-view-components/hide_after_exit"

// コマンドパレット / コンボボックスの絞り込み(10-roadmap Phase 3)。
// SSR済みの項目リストを入力でフィルタし、矢印キーでハイライト移動、
// Enter やクリックで選択(data-selected / data-state を書き換える)
export default class CommandController extends Controller {
  connect() {
    this.chips = this.element.querySelector("[data-slot='combobox-chips']")
    // chipsモードではチップ入力欄が操作対象。併存時は role=combobox の入力より優先する
    this.input = (this.chips && this.element.querySelector("[data-slot='combobox-chip-input']")) ||
      this.element.querySelector("input[role='combobox']") ||
      this.element.querySelector("[data-slot='command-input']")
    this.empty = this.element.querySelector("[data-slot='command-empty'], [data-slot='combobox-empty']")
    // 新規chipの複製元。全chipが削除された後も契約どおりのマークアップを
    // 複製できるよう、接続時のchipを確保しておく
    this.chipTemplate = this.chips?.querySelector("[data-slot='combobox-chip']") ?? null
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
    // chips入力欄はリストを持たないため aria-expanded を持たない(付け替え対象外)
    if (this.input?.hasAttribute("aria-expanded")) {
      this.input.setAttribute("aria-expanded", String(open))
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
    // chips: Enter でハイライト項目を、無ければ入力テキストを新規chipとして確定する
    if (event.key === "Enter" && this.chips) {
      event.preventDefault()
      const highlighted = this.visibleItems.find((item) => item.dataset.selected === "true")
      if (highlighted) highlighted.click()
      else this.commitChip(this.input?.value)
      return
    }
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

  // 項目の選択確定(Item の click->select)。Enter による item.click() もここへ流れる
  select(event) {
    const item = event.currentTarget
    this.highlight(item)
    if (this.chips) {
      // 複数選択: 選択後もリストは開いたまま(upstream と同じ)
      if (this.input) this.input.value = ""
      this.addChip(item.textContent.trim())
      this.filter()
      return
    }
    this.markSelected(item)
    if (this.input) this.input.value = item.textContent.trim()
    this.closeList()
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

  // 単一選択の確定状態(チェックインジケータ)を移す。ハイライト(data-selected)とは別管理
  markSelected(item) {
    for (const candidate of this.items) {
      const indicator = candidate.querySelector("[data-indicator]")
      if (indicator) indicator.hidden = candidate !== item
    }
  }

  removeChip(event) {
    event.currentTarget.closest("[data-slot='combobox-chip']")?.remove()
  }

  commitChip(value) {
    const label = (value ?? "").trim()
    if (label === "" || !this.chips) return
    this.addChip(label)
    if (this.input) {
      this.input.value = ""
      this.filter()
    }
  }

  addChip(label) {
    if (label === "" || !this.chips) return
    const chip = this.buildChip(label)
    if (this.input?.parentElement === this.chips) this.chips.insertBefore(chip, this.input)
    else this.chips.appendChild(chip)
  }

  buildChip(label) {
    // 既存 chip の複製でクラスと削除ボタンを引き継ぐ。どちらも無い場合は簡素に組み直す
    const template = this.chipTemplate || this.chips.querySelector("[data-slot='combobox-chip']")
    if (template) {
      const chip = template.cloneNode(true)
      const text = [...chip.childNodes].find(
        (node) => node.nodeType === Node.TEXT_NODE && node.textContent.trim().length > 0
      )
      if (text) {
        text.textContent = label
      } else {
        const remove = chip.querySelector("[data-slot='combobox-chip-remove']")
        chip.insertBefore(document.createTextNode(label), remove)
      }
      return chip
    }
    const chip = document.createElement("div")
    chip.dataset.slot = "combobox-chip"
    chip.textContent = label
    return chip
  }

  // combobox: トリガーアイコンでリストを開閉する。
  // popover の toggle イベントは非同期のため、表示前に属性を先に切り替える
  // (閉状態属性のまま表示され、exit アニメーションで始まってしまうのを防ぐ)
  toggleList(event) {
    const list = this.list
    if (!list) return
    if (list.matches(":popover-open")) {
      this.closeList()
    } else {
      this.syncListState(true)
      list.showPopover()
    }
  }

  closeList() {
    const list = this.list
    if (!list || !list.matches(":popover-open")) return
    this.syncListState(false)
    hideAfterExit(list, () => {
      if (list.dataset.state === "open") return
      list.hidePopover()
    })
  }
}
