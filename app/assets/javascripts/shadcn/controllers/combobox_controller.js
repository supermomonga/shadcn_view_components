import { Controller } from "@hotwired/stimulus"

import {
  ensureId,
  ensureRootId,
  ownedElements,
  setDefaultAttribute,
} from "@supermomonga/shadcn-view-components/aria_relationships"
import { hideAfterExit } from "@supermomonga/shadcn-view-components/hide_after_exit"

const noop = () => {}
const IDENTIFIER = "shadcn--combobox"

// 検索文字列・キーボード上のハイライト・確定したフォーム値を分離して管理する。
// 確定値の唯一の情報源は root 直下の select[data-slot=combobox-form-control]。
/** @extends {Controller<HTMLElement>} */
export default class ComboboxController extends Controller {
  /** @type {string} */
  query = ""

  /** @type {(event: KeyboardEvent) => void} */
  onKeydown = (event) => this.navigate(event)

  /** @type {() => void} */
  onListToggle = () => this.syncListState()

  /** @type {() => void} */
  onFormControlFocus = () => this.input?.focus()

  /** @type {(event: PointerEvent) => void} */
  onDocumentPointerDown = (event) => this.closeFromOutsidePointer(event)

  /** @type {() => void} */
  onFocusOut = () => this.closeAfterFocusChange()

  /** @type {() => void} */
  cancelListExit = noop

  connect() {
    /** @type {HTMLSelectElement | null} */
    this.formControl = /** @type {HTMLSelectElement | null} */ (
      this.owned("select[data-slot='combobox-form-control']")[0] ?? null
    )
    /** @type {HTMLInputElement | null} */
    this.emptyFormControl = /** @type {HTMLInputElement | null} */ (
      this.owned("input[data-slot='combobox-empty-form-control']")[0] ?? null
    )
    this.multiple = this.formControl?.multiple ?? false
    this.query = ""
    /** @type {HTMLElement | null} */
    this.chips = this.owned("[data-slot='combobox-chips']")[0] ?? null
    /** @type {HTMLInputElement | null} */
    this.input = /** @type {HTMLInputElement | null} */ (
      (this.chips && this.owned("[data-slot='combobox-chip-input']")[0]) ||
      this.owned("input[role='combobox']")[0] || null
    )
    /** @type {HTMLElement | null} */
    this.empty = this.owned("[data-slot='combobox-empty']")[0] ?? null
    /** @type {HTMLTemplateElement | null} */
    const template = this.chips?.querySelector(":scope > template[data-slot='combobox-chip-template']") ?? null
    /** @type {HTMLElement | null} */
    this.chipTemplate = template?.content.querySelector("[data-slot='combobox-chip']") ?? null
    /** @type {HTMLElement | null} */
    this.list = this.owned("[data-slot='combobox-content'][popover]")[0] ?? null

    this.ensureRelationships()

    this.element.addEventListener("keydown", this.onKeydown, true)
    this.element.addEventListener("focusout", this.onFocusOut)
    document.addEventListener("pointerdown", this.onDocumentPointerDown, true)
    this.formControl?.addEventListener("focus", this.onFormControlFocus)
    this.cancelListExit = noop
    if (this.list) {
      this.list.addEventListener("toggle", this.onListToggle)
      this.syncListState()
    }

    this.applyDisabledState()
    this.normalizeFormControl()
    this.syncCommittedPresentation()
    this.restoreCommittedQuery()
  }

  disconnect() {
    const list = this.list
    const finishExit = list?.dataset.state === "closed" && list.matches(":popover-open")
    this.cancelListExit()
    // Turbo が切断中の DOM をキャッシュしても、一時的な検索文字列を残さない。
    this.restoreCommittedQuery()
    this.element.removeEventListener("keydown", this.onKeydown, true)
    this.element.removeEventListener("focusout", this.onFocusOut)
    document.removeEventListener("pointerdown", this.onDocumentPointerDown, true)
    this.formControl?.removeEventListener("focus", this.onFormControlFocus)
    list?.removeEventListener("toggle", this.onListToggle)
    if (finishExit) list.hidePopover()
  }

  /** @returns {HTMLElement[]} */
  get items() {
    return this.owned("[data-slot='combobox-item']")
  }

  /** @returns {HTMLElement[]} */
  get visibleItems() {
    return this.items.filter((item) => !item.hidden)
  }

  /** @returns {HTMLElement[]} */
  get enabledVisibleItems() {
    return this.visibleItems.filter((item) => !this.itemDisabled(item))
  }

  /** @returns {string[]} */
  get rawCommittedValues() {
    if (!this.formControl) return []
    return [...this.formControl.selectedOptions].map((option) => option.value)
  }

  /** @returns {string[]} */
  get committedValues() {
    return this.normalizeValues(this.rawCommittedValues)
  }

  /** @returns {boolean} */
  get disabled() {
    return this.formControl?.disabled ?? false
  }

  /** @returns {boolean} */
  get listOpen() {
    return Boolean(this.list?.dataset.state === "open" && this.list.matches(":popover-open"))
  }

  /** @param {Event} [event] */
  filter(event) {
    if (!this.input) return
    if (event?.target === this.input) {
      this.query = this.input.value.trim().toLowerCase()
      if (!this.multiple) this.clearCommittedValueForEditedQuery()
    }

    const items = this.items
    let visible = 0
    for (const item of items) {
      const text = `${item.dataset.value ?? ""} ${this.itemLabel(item)}`.toLowerCase()
      const match = this.query === "" || text.includes(this.query)
      item.hidden = !match
      if (match) visible += 1
    }

    const groups = this.owned("[data-slot='combobox-group']")
    for (const group of groups) {
      const groupItems = items.filter((item) => group.contains(item))
      group.hidden = groupItems.every((item) => item.hidden)
    }
    const empty = visible === 0
    if (this.empty) this.empty.hidden = !empty
    this.list?.toggleAttribute("data-empty", empty)
    this.owned("[data-slot='combobox-list']")[0]?.toggleAttribute("data-empty", empty)
    this.highlight(this.enabledVisibleItems[0])
  }

  /** @param {KeyboardEvent} event */
  navigate(event) {
    if (!(event.target instanceof Element) ||
        event.target.closest(`[data-controller~='${IDENTIFIER}']`) !== this.element) return

    if (event.key === "Escape" && this.listOpen) {
      event.preventDefault()
      event.stopPropagation()
      this.closeList()
      this.input?.focus()
      return
    }

    const keys = ["ArrowDown", "ArrowUp", "Enter", "Home", "End"]
    if (event.target !== this.input || !keys.includes(event.key) || this.disabled) return

    // 閉じた候補に残るhighlightは確定対象ではない。単一選択ではフォーム送信など
    // input本来のEnterへ委ね、複数選択だけを自由入力として扱う。
    if (!this.listOpen) {
      if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
        event.preventDefault()
        this.openList()
        const items = this.enabledVisibleItems
        const item = ["ArrowUp", "End"].includes(event.key) ? items.at(-1) : items[0]
        this.highlight(item)
        return
      }
      if (event.key === "Enter" && this.multiple) {
        event.preventDefault()
        this.commitFreeValue(this.input?.value)
      }
      return
    }

    if (event.key === "Enter" && this.multiple) {
      event.preventDefault()
      const highlighted = this.enabledVisibleItems.find((item) => item.hasAttribute("data-highlighted"))
      if (highlighted) highlighted.click()
      else this.commitFreeValue(this.input?.value)
      return
    }

    const items = this.enabledVisibleItems
    if (items.length === 0) {
      if (event.key === "Enter") event.preventDefault()
      return
    }
    event.preventDefault()
    if (event.key === "Enter") {
      items.find((item) => item.hasAttribute("data-highlighted"))?.click()
      return
    }

    const current = items.findIndex((item) => item.hasAttribute("data-highlighted"))
    let next = current
    if (event.key === "ArrowDown") next = (current + 1 + items.length) % items.length
    if (event.key === "ArrowUp") next = (current - 1 + items.length) % items.length
    if (event.key === "Home") next = 0
    if (event.key === "End") next = items.length - 1
    this.highlight(items[Math.max(0, next)])
  }

  /** @param {Event} event */
  select(event) {
    const item = event.currentTarget
    if (!(item instanceof HTMLElement) || this.disabled || this.itemDisabled(item)) return

    const value = item.dataset.value
    if (!value) return
    this.highlight(item)
    if (this.multiple) {
      this.writeCommittedValues([...this.committedValues, value], { notify: true })
      if (this.input) this.input.value = ""
      this.query = ""
      this.filter()
      return
    }

    this.writeCommittedValues([value], { notify: true })
    this.closeList()
  }

  /** @param {HTMLElement | undefined} item */
  highlight(item) {
    for (const candidate of this.items) {
      candidate.toggleAttribute("data-highlighted", candidate === item)
    }
    this.syncActiveDescendant(item)
  }

  /** @param {Event} event */
  removeChip(event) {
    if (this.disabled) return
    const target = event.currentTarget
    if (!(target instanceof HTMLElement)) return
    const chip = /** @type {HTMLElement | null} */ (target.closest("[data-slot='combobox-chip']"))
    const value = chip?.dataset.value
    if (!value) return

    this.writeCommittedValues(this.committedValues.filter((candidate) => candidate !== value), { notify: true })
  }

  /** @param {string | null | undefined} rawValue */
  commitFreeValue(rawValue) {
    const value = (rawValue ?? "").trim()
    if (!this.multiple || this.disabled || value === "") return

    this.writeCommittedValues([...this.committedValues, value], { notify: true })
    if (this.input) this.input.value = ""
    this.query = ""
    this.filter()
  }

  normalizeFormControl() {
    const normalized = this.normalizeValues(this.rawCommittedValues)
    const expected = !this.multiple && normalized.length === 0 ? [""] : normalized
    if (!this.sameValues(this.rawCommittedValues, expected)) this.replaceFormOptions(normalized)
    this.syncEmptyFormControl()
  }

  /**
   * @param {string[]} values
   * @param {{ notify: boolean }} options
   * @returns {boolean}
   */
  writeCommittedValues(values, { notify }) {
    const normalized = this.normalizeValues(values)
    if (this.sameValues(this.committedValues, normalized)) return false

    this.replaceFormOptions(normalized)
    this.syncCommittedPresentation()
    if (notify) this.dispatchCommittedValueEvents()
    return true
  }

  /** @param {string[]} values */
  replaceFormOptions(values) {
    if (!this.formControl) return
    const optionValues = !this.multiple && values.length === 0 ? [""] : values
    const options = optionValues.map((value) => {
      const option = document.createElement("option")
      option.value = value
      option.textContent = value
      option.selected = true
      option.defaultSelected = true
      return option
    })
    this.formControl.replaceChildren(...options)
    this.syncEmptyFormControl()
  }

  syncEmptyFormControl() {
    if (!this.emptyFormControl) return
    this.emptyFormControl.disabled = this.disabled || this.committedValues.length > 0
  }

  syncCommittedPresentation() {
    const values = this.committedValues
    const selected = new Set(values)
    for (const item of this.items) {
      const isSelected = selected.has(item.dataset.value ?? "")
      item.dataset.selected = String(isSelected)
      item.setAttribute("aria-selected", String(isSelected))
      const indicator = /** @type {HTMLElement | null} */ (item.querySelector("[data-indicator]"))
      if (indicator) indicator.hidden = !isSelected
    }

    if (this.multiple) {
      this.syncChips(values)
    } else if (this.input && values[0] !== undefined) {
      this.input.value = this.labelForValue(values[0])
    }
  }

  /** @param {string[]} values */
  syncChips(values) {
    if (!this.chips) return
    /** @type {Map<string, HTMLElement>} */
    const existing = new Map()
    // remove() による live HTMLCollection の index shift で次の chip を飛ばさない。
    for (const child of [...this.chips.children]) {
      if (!(child instanceof HTMLElement) || child.dataset.slot !== "combobox-chip") continue
      const value = child.dataset.value
      if (!value || existing.has(value) || !values.includes(value)) {
        child.remove()
      } else {
        existing.set(value, child)
      }
    }

    const template = this.chips.querySelector(":scope > template[data-slot='combobox-chip-template']")
    let reference = this.input?.parentElement === this.chips ? this.input : template
    // 末尾から並びを確定し、既に正しい位置にある chip は動かさない。
    // Stimulus の action を持つ既存要素を不要に再接続させないためである。
    for (const value of [...values].reverse()) {
      const chip = existing.get(value) ?? this.buildChip(value, this.labelForValue(value))
      if (chip.nextElementSibling !== reference) this.chips.insertBefore(chip, reference)
      reference = chip
      existing.delete(value)
    }
    for (const chip of existing.values()) chip.remove()
    this.applyDisabledState()
  }

  /** @param {string} value @param {string} label @returns {HTMLElement} */
  buildChip(value, label) {
    if (!this.chipTemplate) throw new Error("Combobox chips template is missing")

    const chip = /** @type {HTMLElement} */ (this.chipTemplate.cloneNode(true))
    chip.removeAttribute("id")
    chip.querySelectorAll("[id]").forEach((element) => element.removeAttribute("id"))
    chip.dataset.value = value
    const labelNode = chip.querySelector("[data-slot='combobox-chip-label']")
    if (!labelNode) throw new Error("Combobox chips template label is missing")
    labelNode.textContent = label
    return chip
  }

  /** @param {string} value @returns {string} */
  labelForValue(value) {
    const item = this.items.find((candidate) => candidate.dataset.value === value)
    return item ? this.itemLabel(item) : value
  }

  /** @param {HTMLElement} item @returns {string} */
  itemLabel(item) {
    return item.textContent?.trim() ?? ""
  }

  clearCommittedValueForEditedQuery() {
    const value = this.committedValues[0]
    if (value === undefined || this.input?.value !== "") return

    this.writeCommittedValues([], { notify: true })
  }

  restoreCommittedQuery() {
    this.query = ""
    if (!this.input) return
    const value = this.committedValues[0]
    this.input.value = !this.multiple && value !== undefined ? this.labelForValue(value) : ""
    this.filter()
  }

  dispatchCommittedValueEvents() {
    if (!this.formControl) return
    this.formControl.dispatchEvent(new window.Event("input", { bubbles: true }))
    this.formControl.dispatchEvent(new window.Event("change", { bubbles: true }))
  }

  applyDisabledState() {
    this.syncEmptyFormControl()
    if (this.input) {
      this.input.disabled = this.disabled
      if (this.formControl?.required) {
        this.input.setAttribute("aria-required", "true")
      } else {
        this.input.removeAttribute("aria-required")
      }
    }
    if (this.list) {
      if (this.multiple) {
        this.list.setAttribute("aria-multiselectable", "true")
      } else {
        this.list.removeAttribute("aria-multiselectable")
      }
    }
    if (!this.disabled) return
    const buttons = /** @type {HTMLButtonElement[]} */ (this.owned(
      "button[data-action*='shadcn--combobox#toggleList'], [data-slot='combobox-chip-remove']"
    ))
    for (const button of buttons) button.disabled = true
  }

  /** @param {HTMLElement} item @returns {boolean} */
  itemDisabled(item) {
    return item.hasAttribute("disabled") || item.hasAttribute("data-disabled") ||
      item.getAttribute("aria-disabled") === "true"
  }

  /** @param {string[]} values @returns {string[]} */
  normalizeValues(values) {
    const normalized = [...new Set(values.filter((value) => value !== ""))]
    return this.multiple ? normalized : normalized.slice(0, 1)
  }

  /** @param {string[]} left @param {string[]} right @returns {boolean} */
  sameValues(left, right) {
    return left.length === right.length && left.every((value, index) => value === right[index])
  }

  // open 引数を渡すと実開状態より優先する(表示前に属性を切り替えるため)
  /** @param {boolean} [open] */
  syncListState(open = this.list?.matches(":popover-open") ?? false) {
    if (!this.list) return
    if (open) {
      this.cancelListExit()
      this.cancelListExit = noop
    }
    this.list.dataset.state = open ? "open" : "closed"
    if (open) this.list.dataset.side = "bottom"
    if (open) {
      this.list.setAttribute("data-open", "")
      this.list.removeAttribute("data-closed")
    } else {
      this.list.setAttribute("data-closed", "")
      this.list.removeAttribute("data-open")
      // 単一選択では検索表示を確定ラベルへ戻す。複数選択の入力欄は
      // focus 移動に伴う popover の遅延 close で編集中の場合があるため触らない。
      if (!this.multiple) this.restoreCommittedQuery()
    }
    this.input?.setAttribute("aria-expanded", String(open))
    for (const trigger of this.toggleTriggers) trigger.setAttribute("aria-expanded", String(open))
    this.syncActiveDescendant(
      open ? this.enabledVisibleItems.find((item) => item.hasAttribute("data-highlighted")) : undefined,
    )
  }

  toggleList() {
    const list = this.list
    if (!list || this.disabled) return

    const exiting = list.dataset.state === "closed" && list.matches(":popover-open")
    if (list.matches(":popover-open") && !exiting) {
      this.closeList()
    } else {
      this.openList()
    }
  }

  openList() {
    const list = this.list
    if (!list || this.disabled) return

    this.query = this.multiple ? (this.input?.value ?? "").trim().toLowerCase() : ""
    this.filter()
    this.syncListState(true)
    if (!list.matches(":popover-open")) list.showPopover()
    this.input?.focus()
  }

  closeList() {
    const list = this.list
    if (!list || !list.matches(":popover-open") || list.dataset.state === "closed") return
    this.cancelListExit()
    this.syncListState(false)
    this.cancelListExit = hideAfterExit(list, () => {
      this.cancelListExit = noop
      if (list.dataset.state === "open") return
      list.hidePopover()
    })
  }

  /** @param {PointerEvent} event */
  closeFromOutsidePointer(event) {
    const target = event.target
    if (!this.listOpen || !(target instanceof Node) || this.element.contains(target)) return
    this.closeList()
  }

  closeAfterFocusChange() {
    // focusout中はactiveElementが一時的にbodyになるブラウザ操作もあるため、
    // 一連のfocus遷移が終わってからroot外へ出たかを判定する。
    window.queueMicrotask(() => {
      if (!this.element.isConnected || !this.listOpen) return
      const activeElement = document.activeElement
      if (activeElement && this.element.contains(activeElement)) return
      this.closeList()
    })
  }

  ensureRelationships() {
    const rootId = ensureRootId(this.root, "combobox")
    const list = this.list
    if (!list) return

    const listId = ensureId(list, `${rootId}-listbox`)
    if (this.formControl) ensureId(this.formControl, `${rootId}-form-control`)
    this.items.forEach((item, index) => ensureId(item, `${rootId}-option-${index + 1}`))

    if (this.input) {
      const inputId = ensureId(this.input, `${rootId}-input`)
      setDefaultAttribute(this.input, "aria-controls", listId)
      setDefaultAttribute(list, "aria-labelledby", inputId)
    }
    this.toggleTriggers.forEach((trigger, index) => {
      ensureId(trigger, `${rootId}-trigger-${index + 1}`)
      setDefaultAttribute(trigger, "aria-controls", listId)
    })
  }

  /** @param {HTMLElement | undefined} item */
  syncActiveDescendant(item) {
    if (!this.input) return
    if (!this.listOpen || !item || item.hidden) {
      this.input.removeAttribute("aria-activedescendant")
      return
    }

    this.input.setAttribute("aria-activedescendant", item.id)
  }

  /** @returns {HTMLElement[]} */
  get toggleTriggers() {
    return this.owned("button[data-action*='shadcn--combobox#toggleList']")
  }

  /** @param {string} selector @returns {HTMLElement[]} */
  owned(selector) {
    return ownedElements(this.root, selector, IDENTIFIER)
  }

  /** @returns {HTMLElement} */
  get root() {
    return /** @type {HTMLElement} */ (this.element)
  }
}
