import { Controller } from "@hotwired/stimulus"

import {
  ensureId,
  ensureRootId,
  ownedElements,
  setDefaultAttribute,
} from "@supermomonga/shadcn-view-components/aria_relationships"
import { startFloatingPosition } from "@supermomonga/shadcn-view-components/floating_position"
import { hideAfterExit } from "@supermomonga/shadcn-view-components/hide_after_exit"
import { applyStateAttrs } from "@supermomonga/shadcn-view-components/state_attrs"

const noop = () => {}
const IDENTIFIER = "shadcn--select"

// 単一選択のcombobox/listbox。確定値はhidden inputだけに保持し、
// 表示・ARIA・選択印は接続時と選択時にそこから導出する。
/** @extends {Controller<HTMLElement>} */
export default class SelectController extends Controller {
  /** @type {HTMLElement | null} */
  content = null

  /** @type {HTMLElement | null} */
  listbox = null

  /** @type {HTMLButtonElement | null} */
  trigger = null

  /** @type {HTMLInputElement | null} */
  input = null

  /** @type {HTMLElement | null} */
  valueElement = null

  /** @type {HTMLElement | null} */
  scrollUpButton = null

  /** @type {HTMLElement | null} */
  scrollDownButton = null

  /** @type {number | null} */
  scrollTimer = null

  /** @type {"up" | "down" | null} */
  scrollDirection = null

  /** @type {() => void} */
  cancelExit = noop

  /** @type {boolean} */
  isExiting = false

  /** @type {{ update: () => void, destroy: () => void } | null} */
  positioning = null

  /** @type {() => void} */
  onToggle = () => this.syncOpenState()

  /** @type {() => void} */
  onScroll = () => this.syncScrollButtons()

  connect() {
    this.cancelPendingExit()
    this.stopPositioning()
    this.content = this.owned("[data-slot='select-content']")[0] ?? null
    this.listbox = this.owned("[data-slot='select-content'] [role='listbox']")[0] ?? null
    this.trigger = /** @type {HTMLButtonElement | null} */ (
      this.owned("[data-slot='select-trigger']")[0] ?? null
    )
    this.input = /** @type {HTMLInputElement | null} */ (
      this.owned("input[data-slot='select-input']")[0] ?? null
    )
    this.valueElement = this.owned("[data-slot='select-value']")[0] ?? null
    this.scrollUpButton = this.owned(
      "[data-slot='select-content'] [data-slot='select-scroll-up-button']",
    )[0] ?? null
    this.scrollDownButton = this.owned(
      "[data-slot='select-content'] [data-slot='select-scroll-down-button']",
    )[0] ?? null
    if (this.valueElement && this.valueElement.dataset.placeholderLabel === undefined) {
      this.valueElement.dataset.placeholderLabel = this.valueElement.textContent?.trim() ?? ""
    }
    if (this.root.dataset.disabled === "true" && this.trigger) this.trigger.disabled = true

    this.ensureRelationships()
    this.content?.addEventListener("toggle", this.onToggle)
    this.listbox?.addEventListener("scroll", this.onScroll)
    this.syncSelection()
    this.syncOpenState()
  }

  disconnect() {
    const content = this.content
    this.cancelPendingExit()
    this.stopScroll()
    this.stopPositioning()
    content?.removeEventListener("toggle", this.onToggle)
    this.listbox?.removeEventListener("scroll", this.onScroll)
    if (content?.matches(":popover-open")) content.hidePopover()
    if (content) {
      content.dataset.state = "closed"
      applyStateAttrs(content, "closed")
      content.setAttribute("inert", "")
    }
    this.trigger?.setAttribute("aria-expanded", "false")
    this.clearActiveItem()
    this.content = null
    this.listbox = null
    this.trigger = null
    this.input = null
    this.valueElement = null
    this.scrollUpButton = null
    this.scrollDownButton = null
  }

  /** @param {Event} event */
  toggle(event) {
    event.preventDefault()
    if (this.disabled || !this.content) return

    const exiting = this.content.dataset.state === "closed" && this.content.matches(":popover-open")
    if (this.content.matches(":popover-open") && !exiting) this.close()
    else this.open()
  }

  /** @param {KeyboardEvent} event */
  navigate(event) {
    if (!(event.target instanceof Element) ||
        event.target.closest(`[data-controller~='${IDENTIFIER}']`) !== this.element) return

    const key = event.key === "Spacebar" ? " " : event.key
    const keys = ["ArrowDown", "ArrowUp", "Home", "End", "Enter", " ", "Escape", "Tab"]
    if (!keys.includes(key) || this.disabled) return

    const physicallyOpen = this.content?.matches(":popover-open") ?? false
    const open = physicallyOpen && this.content?.dataset.state !== "closed"
    if (key === "Tab") {
      if (open) this.close({ restoreFocus: false })
      return
    }
    if (!open) {
      if (key === "Escape") return
      event.preventDefault()
      if (key === "Home") this.open(this.enabledItems[0])
      else if (key === "End") this.open(this.enabledItems.at(-1))
      else if (key === "ArrowUp") this.open(this.selectedEnabledItem || this.enabledItems.at(-1))
      else this.open(this.selectedEnabledItem || this.enabledItems[0])
      return
    }

    event.preventDefault()
    if (key === "Escape") {
      this.close()
      return
    }
    if (key === "Enter" || key === " ") {
      if (this.activeItem) this.commit(this.activeItem)
      return
    }

    const items = this.enabledItems
    if (items.length === 0) return
    const activeItem = this.activeItem
    const current = activeItem ? items.indexOf(activeItem) : -1
    let next = current
    if (key === "ArrowDown") next = (current + 1 + items.length) % items.length
    if (key === "ArrowUp") next = current < 0 ? items.length - 1 : (current - 1 + items.length) % items.length
    if (key === "Home") next = 0
    if (key === "End") next = items.length - 1
    this.setActiveItem(items[Math.max(0, next)])
  }

  /** @param {Event} event */
  select(event) {
    const item = event.currentTarget
    if (!(item instanceof HTMLElement)) return

    this.commit(item)
  }

  /** @param {Event} event */
  highlight(event) {
    const item = event.currentTarget
    if (!(item instanceof HTMLElement) || !this.content?.matches(":popover-open") || this.itemDisabled(item)) return

    this.setActiveItem(item)
  }

  /** @param {FocusEvent} event */
  focusOut(event) {
    const next = event.relatedTarget
    if (next instanceof Node && this.root.contains(next)) return
    if (this.content?.dataset.state === "open") this.close({ restoreFocus: false })
  }

  /** @param {MouseEvent} event */
  startScroll(event) {
    const button = event.currentTarget
    if (!(button instanceof HTMLElement) || button.hidden || this.scrollTimer !== null) return

    const direction = button.dataset.scrollDirection
    if (direction !== "up" && direction !== "down") return

    this.scrollDirection = direction
    this.scrollTimer = window.setInterval(() => this.scrollOnce(), 40)
    this.scrollOnce()
  }

  stopScroll() {
    if (this.scrollTimer !== null) window.clearInterval(this.scrollTimer)
    this.scrollTimer = null
    this.scrollDirection = null
  }

  /** @param {HTMLElement} [preferredItem] */
  open(preferredItem) {
    const content = this.content
    if (!content || this.disabled) return

    this.cancelPendingExit()
    this.applyOpenState("open")
    if (!content.matches(":popover-open")) content.showPopover()
    this.trigger?.focus({ preventScroll: true })
    this.startPositioning()
    this.setActiveItem(preferredItem || this.selectedEnabledItem || this.enabledItems[0])
    this.syncScrollButtons()
  }

  /** @param {{ restoreFocus?: boolean }} [options] */
  close({ restoreFocus = true } = {}) {
    const content = this.content
    if (!content) return

    this.cancelPendingExit()
    this.stopScroll()
    this.applyOpenState("closed")
    this.clearActiveItem()
    if (restoreFocus) this.trigger?.focus()
    if (!content.matches(":popover-open")) {
      this.isExiting = false
      this.stopPositioning()
      return
    }

    this.isExiting = true
    this.cancelExit = hideAfterExit(content, () => {
      this.isExiting = false
      if (this.content !== content || content.dataset.state === "open") return
      this.stopPositioning()
      content.hidePopover()
    })
  }

  syncOpenState() {
    const content = this.content
    if (!content) return

    const physicallyOpen = content.matches(":popover-open")
    // showPopover() の toggle は別タスクで通知される。開いた直後に閉じた場合、
    // 遅れて届いた open 通知で進行中の退出処理を取り消してはならない。
    if (physicallyOpen && content.dataset.state === "closed" && this.isExiting) return
    // open() は状態・フォーカス・位置決めを同期済み。遅れて届いた同じopen通知で
    // キーボード移動後のactive itemを選択済み項目へ戻してはならない。
    if (physicallyOpen && content.dataset.state === "open") {
      this.syncScrollButtons()
      return
    }

    const state = physicallyOpen ? "open" : "closed"
    if (state === "open") this.cancelPendingExit()
    this.applyOpenState(state)
    if (state === "open") {
      this.startPositioning()
      this.setActiveItem(this.selectedEnabledItem || this.enabledItems[0])
      this.syncScrollButtons()
    } else {
      this.stopScroll()
      this.stopPositioning()
      this.clearActiveItem()
      this.syncScrollButtons()
    }
  }

  /** @param {"open" | "closed"} state */
  applyOpenState(state) {
    if (!this.content) return

    this.content.dataset.state = state
    applyStateAttrs(this.content, state)
    this.content.toggleAttribute("inert", state === "closed")
    this.trigger?.setAttribute("aria-expanded", String(state === "open"))
  }

  /** @param {HTMLElement} item */
  commit(item) {
    if (this.disabled || this.itemDisabled(item) || !this.input) return

    const value = item.dataset.value
    if (value === undefined) return

    const changed = this.input.dataset.valuePresent !== "true" || this.input.value !== value
    this.input.value = value
    this.input.dataset.valuePresent = "true"
    this.syncSelection()
    if (changed) {
      this.input.dispatchEvent(new window.Event("input", { bubbles: true }))
      this.input.dispatchEvent(new window.Event("change", { bubbles: true }))
    }
    this.close()
  }

  syncSelection() {
    const hasValue = this.input?.dataset.valuePresent === "true"
    const selected = hasValue ? this.items.find((item) => item.dataset.value === this.input?.value) : undefined
    for (const item of this.items) {
      const isSelected = item === selected
      item.dataset.selected = String(isSelected)
      item.setAttribute("aria-selected", String(isSelected))
      const indicator = /** @type {HTMLElement | null} */ (item.querySelector("[data-indicator]"))
      if (indicator) indicator.hidden = !isSelected
    }

    if (this.valueElement) {
      const placeholder = this.valueElement.dataset.placeholderLabel ?? ""
      this.valueElement.textContent = selected ? this.itemLabel(selected) : placeholder
      this.valueElement.toggleAttribute("data-placeholder", !selected)
    }
    this.trigger?.toggleAttribute("data-placeholder", !selected)
    if (this.trigger) {
      setDefaultAttribute(this.trigger, "aria-label", this.valueElement?.textContent?.trim() || "選択肢")
    }
  }

  ensureRelationships() {
    if (!this.trigger || !this.listbox) return

    const baseId = ensureRootId(this.root, "select")
    ensureId(this.trigger, `${baseId}-trigger`)
    ensureId(this.listbox, `${baseId}-listbox`)
    setDefaultAttribute(this.trigger, "aria-controls", this.listbox.id)
    setDefaultAttribute(this.listbox, "aria-labelledby", this.trigger.id)
    this.items.forEach((item, index) => {
      ensureId(item, `${baseId}-option-${index + 1}`)
    })
    this.owned("[data-slot='select-group']").forEach((group, index) => {
      const label = this.owned("[data-slot='select-label']").find((candidate) => group.contains(candidate))
      if (!label) return
      ensureId(label, `${baseId}-group-${index + 1}-label`)
      setDefaultAttribute(group, "aria-labelledby", label.id)
    })
  }

  /** @param {HTMLElement | undefined} item */
  setActiveItem(item) {
    if (!item || this.itemDisabled(item)) {
      this.clearActiveItem()
      return
    }

    for (const candidate of this.items) {
      const active = candidate === item
      candidate.dataset.highlighted = String(active)
      candidate.tabIndex = -1
    }
    this.trigger?.setAttribute("aria-activedescendant", item.id)
    item.scrollIntoView?.({ block: "nearest" })
    if (this.listbox) {
      const enabledItems = this.enabledItems
      if (item === enabledItems[0]) this.listbox.scrollTop = 0
      else if (item === enabledItems.at(-1)) {
        this.listbox.scrollTop = Math.max(0, this.listbox.scrollHeight - this.listbox.clientHeight)
      }
      this.syncScrollButtons()
    }
  }

  clearActiveItem() {
    for (const item of this.items) {
      item.dataset.highlighted = "false"
      item.tabIndex = -1
    }
    this.trigger?.removeAttribute("aria-activedescendant")
  }

  startPositioning() {
    if (!this.content || !this.trigger) return

    this.stopPositioning()
    this.positioning = startFloatingPosition({
      align: "center",
      anchor: this.trigger,
      collisionPadding: 5,
      floating: this.content,
      side: "bottom",
      sideOffset: 4,
    })
  }

  stopPositioning() {
    this.positioning?.destroy()
    this.positioning = null
  }

  cancelPendingExit() {
    this.cancelExit()
    this.cancelExit = noop
    this.isExiting = false
  }

  syncScrollButtons() {
    const content = this.content
    const scroller = this.listbox
    const canScroll = Boolean(
      content && content.matches(":popover-open") && scroller && scroller.clientHeight > 0
    )
    const atTop = !scroller || scroller.scrollTop <= 1
    const atBottom = !scroller || scroller.scrollTop + scroller.clientHeight >= scroller.scrollHeight - 1
    this.setScrollButtonVisible(this.scrollUpButton, canScroll && !atTop)
    this.setScrollButtonVisible(this.scrollDownButton, canScroll && !atBottom)

    const activeButton = this.scrollDirection === "up" ? this.scrollUpButton : this.scrollDownButton
    if (activeButton?.hidden) this.stopScroll()
  }

  /** @param {HTMLElement | null} button @param {boolean} visible */
  setScrollButtonVisible(button, visible) {
    if (!button) return
    button.hidden = !visible
    button.toggleAttribute("data-visible", visible)
  }

  scrollOnce() {
    const scroller = this.listbox
    const itemHeight = this.enabledItems.find((item) => item.offsetHeight > 0)?.offsetHeight
    if (!scroller || !itemHeight || !this.scrollDirection) {
      this.stopScroll()
      return
    }

    scroller.scrollTop += (this.scrollDirection === "up" ? -1 : 1) * itemHeight
    this.syncScrollButtons()
  }

  /** @param {HTMLElement} item */
  itemDisabled(item) {
    return item.matches("[aria-disabled='true'], [data-disabled], [disabled]")
  }

  /** @param {HTMLElement} item */
  itemLabel(item) {
    const text = item.querySelector("span:not([data-indicator])")?.textContent ?? item.textContent
    return text.trim()
  }

  /** @returns {HTMLElement[]} */
  get items() {
    return this.listbox ? this.owned("[role='option']") : []
  }

  /** @returns {HTMLElement[]} */
  get enabledItems() {
    return this.items.filter((item) => !this.itemDisabled(item))
  }

  /** @returns {HTMLElement | undefined} */
  get selectedEnabledItem() {
    const selected = this.items.find((item) => item.getAttribute("aria-selected") === "true")
    return selected && !this.itemDisabled(selected) ? selected : undefined
  }

  /** @returns {HTMLElement | undefined} */
  get activeItem() {
    const id = this.trigger?.getAttribute("aria-activedescendant")
    return id ? this.items.find((item) => item.id === id) : undefined
  }

  /** @returns {boolean} */
  get disabled() {
    return this.root.dataset.disabled === "true" || Boolean(this.trigger?.disabled)
  }

  /** @returns {HTMLElement} */
  get root() {
    return this.element
  }

  /** @param {string} selector @returns {HTMLElement[]} */
  owned(selector) {
    return ownedElements(this.root, selector, IDENTIFIER)
  }
}
