import { Controller } from "@hotwired/stimulus"

import {
  activateMenuItemFromKeyboard,
  applyMenuTriggerState,
  associateMenuElements,
  directMenuItems,
  isOwnedMenuElement,
  MenuPopoverManager,
  ownedMenuElements,
  scopedMenuElement,
} from "@supermomonga/shadcn-view-components/menu_popover"

const MENU_SCOPE_SELECTOR = "[data-slot='menubar-menu']"
const SUB_SCOPE_SELECTOR = "[data-slot='menubar-sub']"

// ARIA menubarパターン。トップレベルの左右移動と、各Menuに属するpopoverを
// 明示的なペアとして管理する。DropdownMenuの単一menu状態には依存しない。
export default class MenubarController extends Controller {
  /** @type {HTMLElement[]} */
  topTriggers = []

  /** @type {Set<HTMLElement>} */
  topPopovers = new Set()

  /** @type {Map<HTMLElement, HTMLElement>} */
  triggerToPopover = new Map()

  /** @type {Map<HTMLElement, HTMLElement>} */
  popoverToTrigger = new Map()

  /** @type {MenuPopoverManager | null} */
  popovers = null

  /** @type {HTMLElement | null} */
  suspendedTopTrigger = null

  /** @type {number | null} */
  restoreTopTriggerTimer = null

  /** @type {(event: MouseEvent) => void} */
  onClick = (event) => {
    if (!(event.target instanceof Element) || !isOwnedMenuElement(this.root, event.target)) return

    const item = /** @type {HTMLElement | null} */ (event.target.closest("[role^='menuitem']"))
    if (!item || this.topTriggers.includes(item) || this.triggerToPopover.has(item)) return
    const menu = /** @type {HTMLElement | null} */ (item.closest("[role='menu']"))
    if (menu && this.popovers?.isOpen(menu)) this.closeAll()
  }

  /** @type {(event: KeyboardEvent) => void} */
  onKeydown = (event) => this.navigate(event)

  /** @type {(event: FocusEvent) => void} */
  onFocusOut = (event) => {
    const next = event.relatedTarget
    if (!(next instanceof Node && this.popovers?.containsOpenPopover(next))) this.closeAll()
  }

  /** @type {(event: PointerEvent) => void} */
  onDocPointerDown = (event) => {
    if (!this.popovers) return
    this.popovers.beginPointerDown()
    if (!(event.target instanceof Node)) return

    for (const popover of this.popovers.openPopovers().reverse()) {
      const trigger = this.popoverToTrigger.get(popover)
      if (popover.contains(event.target)) continue
      if (trigger?.contains(event.target)) {
        this.popovers.recordOpenTriggerPointerDown(event, popover, trigger)
        continue
      }
      this.popovers.hide(popover)
    }
  }

  connect() {
    this.configurePairs()
    this.initializeTopLevelFocus()
    this.popovers = new MenuPopoverManager(this.root, (popover, state) => this.syncState(popover, state))
    this.popovers.connect()
    this.root.addEventListener("click", this.onClick, true)
    this.root.addEventListener("keydown", this.onKeydown, true)
    this.root.addEventListener("focusout", this.onFocusOut)
    document.addEventListener("pointerdown", this.onDocPointerDown)
  }

  disconnect() {
    this.root.removeEventListener("click", this.onClick, true)
    this.root.removeEventListener("keydown", this.onKeydown, true)
    this.root.removeEventListener("focusout", this.onFocusOut)
    document.removeEventListener("pointerdown", this.onDocPointerDown)
    this.restoreTopLevelTabStop()
    this.popovers?.disconnect()
    this.popovers = null
    this.topTriggers = []
    this.topPopovers.clear()
    this.triggerToPopover.clear()
    this.popoverToTrigger.clear()
  }

  configurePairs() {
    this.topTriggers = []
    this.topPopovers.clear()
    this.triggerToPopover.clear()
    this.popoverToTrigger.clear()

    for (const scope of ownedMenuElements(this.root, MENU_SCOPE_SELECTOR)) {
      const trigger = scopedMenuElement(
        this.root,
        scope,
        MENU_SCOPE_SELECTOR,
        "[data-slot='menubar-trigger']",
      )
      const popover = scopedMenuElement(
        this.root,
        scope,
        MENU_SCOPE_SELECTOR,
        "[data-slot='menubar-content'][popover]",
      )
      if (!trigger || !popover) continue

      this.addPair(trigger, popover, "shadcn-menubar")
      this.topTriggers.push(trigger)
      this.topPopovers.add(popover)
    }

    for (const scope of ownedMenuElements(this.root, SUB_SCOPE_SELECTOR)) {
      const trigger = scopedMenuElement(
        this.root,
        scope,
        SUB_SCOPE_SELECTOR,
        "[data-slot='menubar-sub-trigger']",
      )
      const popover = scopedMenuElement(
        this.root,
        scope,
        SUB_SCOPE_SELECTOR,
        "[data-slot='menubar-sub-content'][popover]",
      )
      if (trigger && popover) this.addPair(trigger, popover, "shadcn-menubar-submenu")
    }
  }

  /** @param {HTMLElement} trigger @param {HTMLElement} popover @param {string} prefix */
  addPair(trigger, popover, prefix) {
    associateMenuElements(trigger, popover, prefix)
    this.triggerToPopover.set(trigger, popover)
    this.popoverToTrigger.set(popover, trigger)
  }

  initializeTopLevelFocus() {
    const triggers = this.enabledTopTriggers()
    const active = triggers.find((trigger) => trigger.tabIndex === 0) ?? triggers[0]
    for (const trigger of this.topTriggers) trigger.tabIndex = trigger === active ? 0 : -1
  }

  suspendTopLevelTabStop() {
    this.restoreTopLevelTabStop()
    this.suspendedTopTrigger = this.enabledTopTriggers().find((trigger) => trigger.tabIndex === 0) ?? null
    for (const item of ownedMenuElements(this.root, "[role^='menuitem']")) item.tabIndex = -1
    this.restoreTopTriggerTimer = window.setTimeout(() => this.restoreTopLevelTabStop(), 0)
  }

  restoreTopLevelTabStop() {
    const trigger = this.suspendedTopTrigger
    this.cancelTopLevelTabStopRestoration()
    if (!trigger) return
    if (this.topTriggers.includes(trigger)
      && !trigger.hasAttribute("disabled")
      && trigger.getAttribute("aria-disabled") !== "true") {
      this.focusTopTrigger(trigger)
    } else {
      this.initializeTopLevelFocus()
    }
  }

  cancelTopLevelTabStopRestoration() {
    if (this.restoreTopTriggerTimer !== null) window.clearTimeout(this.restoreTopTriggerTimer)
    this.restoreTopTriggerTimer = null
    this.suspendedTopTrigger = null
  }

  /** @param {Event} event */
  toggle(event) {
    if (!(event.currentTarget instanceof HTMLElement)) return

    const popover = this.triggerToPopover.get(event.currentTarget)
    if (!popover || !this.topPopovers.has(popover) || !this.popovers) return
    this.focusTopTrigger(event.currentTarget)
    if (this.popovers.consumeOpenTriggerPointer(event, event.currentTarget)) {
      this.closeMenu(popover)
      return
    }
    if (this.popovers.isOpen(popover)) this.closeMenu(popover)
    else this.openTopLevel(event.currentTarget, "first")
  }

  /** @param {Event} event */
  toggleSub(event) {
    if (!(event.currentTarget instanceof HTMLElement)) return

    const popover = this.triggerToPopover.get(event.currentTarget)
    if (!popover || this.topPopovers.has(popover) || !this.popovers) return
    if (this.popovers.consumeOpenTriggerPointer(event, event.currentTarget)) {
      this.closeMenu(popover)
      return
    }
    if (this.popovers.isOpen(popover)) this.closeMenu(popover)
    else this.openSubmenu(event.currentTarget, "first")
  }

  activate() {
    this.closeAll()
  }

  /** @param {KeyboardEvent} event */
  navigate(event) {
    const target = event.target
    if (!(target instanceof Element) || !isOwnedMenuElement(this.root, target)) return

    if (event.key === "Tab" && (this.popovers?.openPopovers().length ?? 0) > 0) {
      this.suspendTopLevelTabStop()
      this.closeAll()
      return
    }

    const topTrigger = /** @type {HTMLElement | null} */ (target.closest("[data-slot='menubar-trigger']"))
    if (topTrigger && this.topTriggers.includes(topTrigger)) {
      this.navigateTopLevel(event, topTrigger)
      return
    }

    const menu = /** @type {HTMLElement | null} */ (target.closest("[role='menu']"))
    if (menu && this.popovers?.isOpen(menu)) this.navigateMenu(event, menu)
  }

  /** @param {KeyboardEvent} event @param {HTMLElement} trigger */
  navigateTopLevel(event, trigger) {
    const keys = ["ArrowRight", "ArrowLeft", "ArrowDown", "ArrowUp", "Home", "End", "Escape"]
    if (!keys.includes(event.key)) return
    event.preventDefault()

    if (event.key === "Escape") {
      this.closeAll()
      trigger.focus()
      return
    }
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      this.openTopLevel(trigger, event.key === "ArrowDown" ? "first" : "last")
      return
    }

    const next = this.topLevelDestination(trigger, event.key)
    if (!next) return
    const hadOpenMenu = this.openTopLevelPopover() !== null
    this.focusTopTrigger(next)
    next.focus()
    if (hadOpenMenu) this.openTopLevel(next, "first")
  }

  /** @param {KeyboardEvent} event @param {HTMLElement} menu */
  navigateMenu(event, menu) {
    const items = directMenuItems(this.root, menu)
    const target = event.target
    const active = menu.ownerDocument.activeElement
    const current = items.findIndex((item) => (
      item === target || (target instanceof Node && item.contains(target))
      || item === active || (active instanceof Node && item.contains(active))
    ))
    if (activateMenuItemFromKeyboard(event, items[current])) return

    const keys = ["ArrowDown", "ArrowUp", "ArrowRight", "ArrowLeft", "Home", "End", "Escape"]
    if (!keys.includes(event.key)) return
    event.preventDefault()
    if (event.key === "Escape") {
      this.escapeMenu(menu)
      return
    }
    if (event.key === "ArrowRight" && current >= 0) {
      const submenu = this.triggerToPopover.get(items[current])
      if (submenu && !this.topPopovers.has(submenu)) {
        this.openSubmenu(items[current], "first")
        return
      }
    }
    if (event.key === "ArrowLeft" && !this.topPopovers.has(menu)) {
      const parentTrigger = this.popoverToTrigger.get(menu)
      this.closeMenu(menu)
      parentTrigger?.focus()
      return
    }
    if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
      const owner = this.topLevelOwner(menu)
      const next = owner ? this.topLevelDestination(owner, event.key) : null
      if (next) {
        this.focusTopTrigger(next)
        this.openTopLevel(next, "first")
      }
      return
    }
    if (items.length === 0) return

    let nextIndex = current
    if (event.key === "ArrowDown") nextIndex = (current + 1 + items.length) % items.length
    if (event.key === "ArrowUp") nextIndex = (current - 1 + items.length) % items.length
    if (event.key === "Home") nextIndex = 0
    if (event.key === "End") nextIndex = items.length - 1
    this.focusItem(menu, items[Math.max(0, nextIndex)])
  }

  /** @param {HTMLElement} menu */
  escapeMenu(menu) {
    const trigger = this.popoverToTrigger.get(menu)
    if (this.topPopovers.has(menu)) {
      this.closeAll()
      this.focusTopTrigger(trigger)
      trigger?.focus()
      return
    }

    this.closeMenu(menu)
    trigger?.focus()
  }

  /** @param {HTMLElement} trigger @param {"first" | "last"} boundary */
  openTopLevel(trigger, boundary) {
    const popover = this.triggerToPopover.get(trigger)
    if (!popover || !this.topPopovers.has(popover) || !this.popovers) return

    this.popovers.hideAll([popover])
    this.popovers.show(popover, trigger, { align: "start", alignOffset: -4, side: "bottom", sideOffset: 8 })
    this.focusBoundaryItem(popover, boundary)
  }

  /** @param {HTMLElement} trigger @param {"first" | "last"} boundary */
  openSubmenu(trigger, boundary) {
    const popover = this.triggerToPopover.get(trigger)
    if (!popover || this.topPopovers.has(popover) || !this.popovers) return

    this.popovers.show(popover, trigger, { align: "start", alignOffset: -3, side: "right", sideOffset: 0 })
    this.focusBoundaryItem(popover, boundary)
  }

  /** @param {HTMLElement} menu */
  closeMenu(menu) {
    this.closeDescendants(menu)
    this.popovers?.hide(menu)
  }

  closeAll() {
    this.popovers?.hideAll()
  }

  /** @param {HTMLElement} parent */
  closeDescendants(parent) {
    for (const popover of this.popovers?.openPopovers() ?? []) {
      if (popover !== parent && parent.contains(popover)) this.popovers?.hide(popover)
    }
  }

  /** @param {HTMLElement} popover @param {"open" | "closed"} state */
  syncState(popover, state) {
    applyMenuTriggerState(this.popoverToTrigger.get(popover), state)
    if (state === "closed") this.closeDescendants(popover)
  }

  /** @param {HTMLElement} trigger @param {string} key */
  topLevelDestination(trigger, key) {
    const triggers = this.enabledTopTriggers()
    const current = triggers.indexOf(trigger)
    if (current < 0 || triggers.length === 0) return null
    if (key === "Home") return triggers[0]
    if (key === "End") return triggers.at(-1) ?? null

    const rtl = this.root.ownerDocument.defaultView?.getComputedStyle(this.root).direction === "rtl"
    const forward = key === "ArrowRight" ? !rtl : rtl
    return triggers[(current + (forward ? 1 : -1) + triggers.length) % triggers.length]
  }

  /** @returns {HTMLElement[]} */
  enabledTopTriggers() {
    return this.topTriggers.filter((trigger) => (
      !trigger.hasAttribute("disabled") && trigger.getAttribute("aria-disabled") !== "true"
    ))
  }

  /** @param {HTMLElement | undefined} trigger */
  focusTopTrigger(trigger) {
    if (!trigger) return

    this.cancelTopLevelTabStopRestoration()
    for (const candidate of this.topTriggers) candidate.tabIndex = candidate === trigger ? 0 : -1
  }

  /** @returns {HTMLElement | null} */
  openTopLevelPopover() {
    return [...this.topPopovers].find((popover) => this.popovers?.isOpen(popover)) ?? null
  }

  /** @param {HTMLElement} menu @returns {HTMLElement | null} */
  topLevelOwner(menu) {
    if (this.topPopovers.has(menu)) return this.popoverToTrigger.get(menu) ?? null
    const popover = [...this.topPopovers].find((candidate) => candidate.contains(menu))
    return popover ? this.popoverToTrigger.get(popover) ?? null : null
  }

  /** @param {HTMLElement} menu @param {"first" | "last"} boundary */
  focusBoundaryItem(menu, boundary) {
    const items = directMenuItems(this.root, menu)
    this.focusItem(menu, boundary === "first" ? items[0] : items.at(-1))
  }

  /** @param {HTMLElement} menu @param {HTMLElement | undefined} item */
  focusItem(menu, item) {
    if (!item) return

    for (const candidate of directMenuItems(this.root, menu)) {
      const highlighted = candidate === item
      candidate.dataset.highlighted = highlighted ? "true" : "false"
      candidate.tabIndex = highlighted ? 0 : -1
    }
    item.focus()
  }

  /** @returns {HTMLElement} */
  get root() {
    return /** @type {HTMLElement} */ (this.element)
  }
}
