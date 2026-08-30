import { Controller } from "@hotwired/stimulus"

import {
  applyMenuTriggerState,
  associateMenuElements,
  isOwnedMenuElement,
  MenuPopoverManager,
  ownedMenuElements,
  scopedMenuElement,
} from "@supermomonga/shadcn-view-components/menu_popover"

const ITEM_SCOPE_SELECTOR = "[data-slot='navigation-menu-item']"
const CONTENT_SELECTOR = "[data-slot='navigation-menu-content'][popover]"

// NavigationMenuはARIA menuではなく、通常のnav/linkと開閉領域を組み合わせる。
// LinkのTab/Enter操作を保ちつつ、トップレベル移動とTriggerごとのContentを管理する。
export default class NavigationMenuController extends Controller {
  /** @type {HTMLElement[]} */
  topControls = []

  /** @type {Map<HTMLElement, HTMLElement>} */
  triggerToPopover = new Map()

  /** @type {Map<HTMLElement, HTMLElement>} */
  popoverToTrigger = new Map()

  /** @type {MenuPopoverManager | null} */
  popovers = null

  /** @type {(event: MouseEvent) => void} */
  onClick = (event) => {
    if (!(event.target instanceof Element) || !isOwnedMenuElement(this.root, event.target)) return

    const link = event.target.closest("[data-slot='navigation-menu-link']")
    if (link) this.closeAll()
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
      if (trigger?.contains(event.target)) {
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
    this.topControls = []
    this.triggerToPopover.clear()
    this.popoverToTrigger.clear()
  }

  configurePairs() {
    this.topControls = []
    this.triggerToPopover.clear()
    this.popoverToTrigger.clear()

    for (const scope of ownedMenuElements(this.root, ITEM_SCOPE_SELECTOR)) {
      const trigger = scopedMenuElement(
        this.root,
        scope,
        ITEM_SCOPE_SELECTOR,
        "[data-slot='navigation-menu-trigger']",
      )
      const popover = scopedMenuElement(this.root, scope, ITEM_SCOPE_SELECTOR, CONTENT_SELECTOR)
      if (trigger && popover) {
        associateMenuElements(trigger, popover, "shadcn-navigation-menu", { labelContent: false })
        this.triggerToPopover.set(trigger, popover)
        this.popoverToTrigger.set(popover, trigger)
        this.topControls.push(trigger)
        continue
      }

      const link = scopedMenuElement(
        this.root,
        scope,
        ITEM_SCOPE_SELECTOR,
        "[data-slot='navigation-menu-link']",
      )
      if (link && !link.closest(CONTENT_SELECTOR)) this.topControls.push(link)
    }
  }

  /** @param {Event} event */
  toggle(event) {
    if (!(event.currentTarget instanceof HTMLElement)) return

    const popover = this.triggerToPopover.get(event.currentTarget)
    if (!popover || !this.popovers) return
    if (this.popovers.consumeOpenTriggerPointer(event, event.currentTarget)) {
      this.popovers.hide(popover)
      return
    }
    if (this.popovers.isOpen(popover)) this.popovers.hide(popover)
    else this.open(event.currentTarget, false, "first")
  }

  /** @param {KeyboardEvent} event */
  navigate(event) {
    const target = event.target
    if (!(target instanceof Element) || !isOwnedMenuElement(this.root, target)) return

    const content = /** @type {HTMLElement | null} */ (target.closest(CONTENT_SELECTOR))
    if (content && this.popovers?.isOpen(content)) {
      this.navigateContent(event, content)
      return
    }

    const control = /** @type {HTMLElement | null} */ (
      target.closest("[data-slot='navigation-menu-trigger'], [data-slot='navigation-menu-link']")
    )
    if (control && this.topControls.includes(control)) this.navigateTopLevel(event, control)
  }

  /** @param {KeyboardEvent} event @param {HTMLElement} control */
  navigateTopLevel(event, control) {
    const keys = ["ArrowRight", "ArrowLeft", "ArrowDown", "ArrowUp", "Home", "End", "Escape"]
    if (!keys.includes(event.key)) return
    event.preventDefault()

    const popover = this.triggerToPopover.get(control)
    if (event.key === "Escape") {
      if (popover) this.popovers?.hide(popover)
      control.focus()
      return
    }
    if ((event.key === "ArrowDown" || event.key === "ArrowUp") && popover) {
      this.open(control, true, event.key === "ArrowDown" ? "first" : "last")
      return
    }

    const next = this.topLevelDestination(control, event.key)
    if (!next) return
    const hadOpenPopover = this.popovers?.openPopovers().length !== 0
    next.focus()
    if (!hadOpenPopover) return

    if (this.triggerToPopover.has(next)) this.open(next, false, "first")
    else this.closeAll()
  }

  /** @param {KeyboardEvent} event @param {HTMLElement} content */
  navigateContent(event, content) {
    const keys = ["ArrowDown", "ArrowUp", "Home", "End", "Escape"]
    if (!keys.includes(event.key)) return
    event.preventDefault()

    const trigger = this.popoverToTrigger.get(content)
    if (event.key === "Escape") {
      this.popovers?.hide(content)
      trigger?.focus()
      return
    }

    const links = this.contentControls(content)
    if (links.length === 0) return
    const target = event.target
    const current = links.findIndex((link) => link === target || (target instanceof Node && link.contains(target)))
    let next = current
    if (event.key === "ArrowDown") next = (current + 1 + links.length) % links.length
    if (event.key === "ArrowUp") next = (current - 1 + links.length) % links.length
    if (event.key === "Home") next = 0
    if (event.key === "End") next = links.length - 1
    links[Math.max(0, next)]?.focus()
  }

  /** @param {HTMLElement} trigger @param {boolean} moveFocus @param {"first" | "last"} boundary */
  open(trigger, moveFocus, boundary) {
    const popover = this.triggerToPopover.get(trigger)
    if (!popover || !this.popovers) return

    this.popovers.hideAll([popover])
    this.popovers.show(popover, trigger, { align: "start", side: "bottom", sideOffset: 8 })
    if (!moveFocus) return

    const controls = this.contentControls(popover)
    const destination = boundary === "first" ? controls[0] : controls.at(-1)
    destination?.focus()
  }

  closeAll() {
    this.popovers?.hideAll()
  }

  /** @param {HTMLElement} popover @param {"open" | "closed"} state */
  syncState(popover, state) {
    applyMenuTriggerState(this.popoverToTrigger.get(popover), state)
  }

  /** @param {HTMLElement} content @returns {HTMLElement[]} */
  contentControls(content) {
    return ownedMenuElements(
      this.root,
      `${CONTENT_SELECTOR} a[href], ${CONTENT_SELECTOR} button:not([disabled]), ${CONTENT_SELECTOR} [tabindex]`,
    )
      .filter((element) => element.closest(CONTENT_SELECTOR) === content)
      .filter((element) => !element.hasAttribute("disabled") && element.getAttribute("aria-disabled") !== "true")
  }

  /** @param {HTMLElement} control @param {string} key @returns {HTMLElement | null} */
  topLevelDestination(control, key) {
    const controls = this.topControls.filter((candidate) => (
      !candidate.hasAttribute("disabled") && candidate.getAttribute("aria-disabled") !== "true"
    ))
    const current = controls.indexOf(control)
    if (current < 0 || controls.length === 0) return null
    if (key === "Home") return controls[0]
    if (key === "End") return controls.at(-1) ?? null
    if (key !== "ArrowRight" && key !== "ArrowLeft") return null

    const rtl = this.root.ownerDocument.defaultView?.getComputedStyle(this.root).direction === "rtl"
    const forward = key === "ArrowRight" ? !rtl : rtl
    return controls[(current + (forward ? 1 : -1) + controls.length) % controls.length]
  }

  /** @returns {HTMLElement} */
  get root() {
    return /** @type {HTMLElement} */ (this.element)
  }
}
