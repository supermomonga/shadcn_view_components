import { Controller } from "@hotwired/stimulus"

import { pointAnchor } from "@supermomonga/shadcn-view-components/floating_position"
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

const SUB_SCOPE_SELECTOR = "[data-slot$='-sub']"
const SUB_TRIGGER_SELECTOR = "[data-slot$='-sub-trigger']"

// DropdownMenu / ContextMenu固有のARIA menu状態を管理する。
// MenubarとNavigationMenuはDOM構造・操作モデルが異なるため専用controllerを使う。
export default class MenuController extends Controller {
  /** @type {HTMLElement | null} */
  rootMenu = null

  /** @type {HTMLElement | null} */
  rootTrigger = null

  /** @type {Map<HTMLElement, HTMLElement>} */
  triggerToPopover = new Map()

  /** @type {Map<HTMLElement, HTMLElement>} */
  popoverToTrigger = new Map()

  /** @type {MenuPopoverManager | null} */
  popovers = null

  /** @type {(event: MouseEvent) => void} */
  onClick = (event) => {
    if (!(event.target instanceof Element) || !isOwnedMenuElement(this.root, event.target)) return

    const item = /** @type {HTMLElement | null} */ (event.target.closest("[role^='menuitem']"))
    if (!item || this.triggerToPopover.has(item)) return
    const menu = /** @type {HTMLElement | null} */ (item.closest("[role='menu']"))
    if (menu && this.popovers?.isOpen(menu)) this.closeAll()
  }

  /** @type {(event: KeyboardEvent) => void} */
  onKeydown = (event) => this.navigate(event)

  /** @type {(event: FocusEvent) => void} */
  onFocusOut = (event) => {
    const next = event.relatedTarget
    if (next instanceof Node && this.popovers?.containsOpenPopover(next)) return
    this.closeAll()
  }

  /** @type {(event: PointerEvent) => void} */
  onDocPointerDown = (event) => {
    if (!this.popovers) return
    this.popovers.beginPointerDown()
    if (!(event.target instanceof Node)) return

    for (const popover of this.popovers.openPopovers().reverse()) {
      const trigger = this.popoverToTrigger.get(popover)
      if (popover.contains(event.target)) continue
      if (!trigger?.matches("[data-slot='context-menu-trigger']") && trigger?.contains(event.target)) {
        this.popovers.recordOpenTriggerPointerDown(event, popover, trigger)
        continue
      }
      this.popovers.hide(popover)
    }
  }

  connect() {
    this.configurePairs()
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
    this.popovers?.disconnect()
    this.popovers = null
    this.rootMenu = null
    this.rootTrigger = null
    this.triggerToPopover.clear()
    this.popoverToTrigger.clear()
  }

  configurePairs() {
    this.triggerToPopover.clear()
    this.popoverToTrigger.clear()

    for (const scope of ownedMenuElements(this.root, SUB_SCOPE_SELECTOR)) {
      const trigger = scopedMenuElement(this.root, scope, SUB_SCOPE_SELECTOR, SUB_TRIGGER_SELECTOR)
      const popover = scopedMenuElement(this.root, scope, SUB_SCOPE_SELECTOR, "[popover][role='menu']")
      if (trigger && popover) this.addPair(trigger, popover, "shadcn-submenu")
    }

    this.rootMenu = ownedMenuElements(this.root, "[popover][role='menu']")
      .find((popover) => !this.popoverToTrigger.has(popover)) ?? null
    this.rootTrigger = ownedMenuElements(this.root, "[aria-haspopup='menu']")
      .find((trigger) => !trigger.matches(SUB_TRIGGER_SELECTOR)) ?? null
    if (this.rootTrigger && this.rootMenu) this.addPair(this.rootTrigger, this.rootMenu, "shadcn-menu")
  }

  /** @param {HTMLElement} trigger @param {HTMLElement} popover @param {string} prefix */
  addPair(trigger, popover, prefix) {
    associateMenuElements(trigger, popover, prefix)
    this.triggerToPopover.set(trigger, popover)
    this.popoverToTrigger.set(popover, trigger)
  }

  /** @param {Event} event */
  toggle(event) {
    if (!(event.currentTarget instanceof HTMLElement)) return

    const popover = this.triggerToPopover.get(event.currentTarget)
    if (!popover || !this.popovers) return
    if (this.popovers.consumeOpenTriggerPointer(event, event.currentTarget)) {
      this.closeMenu(popover)
      return
    }
    if (this.popovers.isOpen(popover)) this.closeMenu(popover)
    else this.showMenu(popover, event.currentTarget)
  }

  /** @param {MouseEvent} event */
  showAt(event) {
    if (!(event.currentTarget instanceof HTMLElement) || !this.rootMenu || !this.popovers) return

    event.preventDefault()
    this.popovers.hideAll([this.rootMenu])
    this.popovers.show(
      this.rootMenu,
      pointAnchor(event.clientX, event.clientY, event.currentTarget),
      { align: "start", alignOffset: 4, side: "right", sideOffset: 0 },
    )
    this.focusBoundaryItem(this.rootMenu, "first")
  }

  /** @param {Event} event */
  toggleSub(event) {
    if (!(event.currentTarget instanceof HTMLElement)) return

    const popover = this.triggerToPopover.get(event.currentTarget)
    if (!popover || !this.popovers) return
    if (this.popovers.consumeOpenTriggerPointer(event, event.currentTarget)) {
      this.closeMenu(popover)
      return
    }
    if (this.popovers.isOpen(popover)) this.closeMenu(popover)
    else this.showMenu(popover, event.currentTarget)
  }

  activate() {
    this.closeAll()
  }

  /** @param {KeyboardEvent} event */
  navigate(event) {
    const target = event.target
    if (!(target instanceof Element) || !isOwnedMenuElement(this.root, target)) return

    if (event.key === "Tab" && (this.popovers?.openPopovers().length ?? 0) > 0) {
      this.closeAll()
      return
    }

    const menu = /** @type {HTMLElement | null} */ (target.closest("[role='menu']"))
    if (!menu || !this.popovers?.isOpen(menu)) return

    const items = directMenuItems(this.root, menu)
    const active = menu.ownerDocument.activeElement
    const current = items.findIndex((item) => (
      item === target || item.contains(target) || item === active || (active instanceof Node && item.contains(active))
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
      if (submenu) this.showMenu(submenu, items[current])
      return
    }
    if (event.key === "ArrowLeft") {
      const parentTrigger = this.popoverToTrigger.get(menu)
      if (menu !== this.rootMenu && parentTrigger) {
        this.closeMenu(menu)
        parentTrigger.focus()
      }
      return
    }
    if (items.length === 0) return

    let next = current
    if (event.key === "ArrowDown") next = (current + 1 + items.length) % items.length
    if (event.key === "ArrowUp") next = (current - 1 + items.length) % items.length
    if (event.key === "Home") next = 0
    if (event.key === "End") next = items.length - 1
    this.focusItem(menu, items[Math.max(0, next)])
  }

  /** @param {HTMLElement} menu */
  escapeMenu(menu) {
    const trigger = this.popoverToTrigger.get(menu)
    if (menu === this.rootMenu) {
      this.closeAll()
      trigger?.focus()
      return
    }

    this.closeMenu(menu)
    trigger?.focus()
  }

  /** @param {HTMLElement} menu @param {HTMLElement} anchor */
  showMenu(menu, anchor) {
    if (!this.popovers) return

    const isSubmenu = menu !== this.rootMenu
    this.popovers.show(menu, anchor, isSubmenu
      ? { align: "start", alignOffset: -3, side: "right", sideOffset: 0 }
      : { align: "start", side: "bottom", sideOffset: 4 })
    this.focusBoundaryItem(menu, "first")
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
    const trigger = this.popoverToTrigger.get(popover)
    applyMenuTriggerState(trigger, state, { expanded: !trigger?.matches("[data-slot='context-menu-trigger']") })
    if (state === "closed") this.closeDescendants(popover)
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
