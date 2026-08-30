import { startFloatingPosition } from "@supermomonga/shadcn-view-components/floating_position"
import { hideAfterExit } from "@supermomonga/shadcn-view-components/hide_after_exit"
import { applyStateAttrs } from "@supermomonga/shadcn-view-components/state_attrs"

const MENU_ROOT_SELECTOR = [
  "[data-controller~='shadcn--menu']",
  "[data-controller~='shadcn--menubar']",
  "[data-controller~='shadcn--navigation-menu']",
].join(",")

let associationSequence = 0

/** @type {Set<MenuPopoverManager>} */
const connectedManagers = new Set()

/** @param {HTMLElement} root @param {Element} element */
export function isOwnedMenuElement(root, element) {
  return element.closest(MENU_ROOT_SELECTOR) === root
}

/**
 * 同じメニュー族controllerのrootに属する要素だけを返す。
 * 入れ子のDropdownMenu等は、それ自身のrootが最寄りになるため混入しない。
 *
 * @param {HTMLElement} root
 * @param {string} selector
 * @returns {HTMLElement[]}
 */
export function ownedMenuElements(root, selector) {
  return /** @type {HTMLElement[]} */ (
    [...root.querySelectorAll(selector)].filter((element) => (
      element instanceof HTMLElement && isOwnedMenuElement(root, element)
    ))
  )
}

/**
 * scope直下の意味的な部品を返す。Portal等の機能ラッパーは許容しつつ、
 * 同種の内側scopeに属する要素は除外する。
 *
 * @param {HTMLElement} root
 * @param {HTMLElement} scope
 * @param {string} scopeSelector
 * @param {string} selector
 * @returns {HTMLElement | null}
 */
export function scopedMenuElement(root, scope, scopeSelector, selector) {
  return ownedMenuElements(root, selector).find((element) => element.closest(scopeSelector) === scope) ?? null
}

/**
 * 現在のrole=menuに直接属する操作項目だけを返す。閉じたサブメニューの項目は含めない。
 *
 * @param {HTMLElement} root
 * @param {HTMLElement} menu
 * @returns {HTMLElement[]}
 */
export function directMenuItems(root, menu) {
  return ownedMenuElements(root, "[role^='menuitem']")
    .filter((item) => item.closest("[role='menu']") === menu)
    .filter((item) => !item.hasAttribute("disabled") && item.getAttribute("aria-disabled") !== "true")
}

/**
 * role=menuitemの既定要素(div)にも、ネイティブ操作要素と同じ
 * Enter/Space活性化を与える。既定動作を止めてclickへ一本化するため、
 * button/linkへタグを差し替えた場合も二重発火しない。
 *
 * @param {KeyboardEvent} event
 * @param {HTMLElement | undefined} item
 * @returns {boolean}
 */
export function activateMenuItemFromKeyboard(event, item) {
  if (!item || !["Enter", " ", "Spacebar"].includes(event.key)) return false

  event.preventDefault()
  item.click()
  return true
}

/**
 * triggerとcontentをID/ARIAで一対一に関連付ける。利用者が指定したIDは維持する。
 *
 * @param {HTMLElement} trigger
 * @param {HTMLElement} content
 * @param {string} prefix
 * @param {{labelContent?: boolean}} [options]
 */
export function associateMenuElements(trigger, content, prefix, options = {}) {
  ensureId(trigger, `${prefix}-trigger`)
  ensureId(content, `${prefix}-content`)
  trigger.setAttribute("aria-controls", content.id)
  if (options.labelContent !== false) content.setAttribute("aria-labelledby", trigger.id)
}

/**
 * @param {HTMLElement | undefined} trigger
 * @param {"open" | "closed"} state
 * @param {{expanded?: boolean}} [options]
 */
export function applyMenuTriggerState(trigger, state, options = {}) {
  if (!trigger) return

  if (options.expanded === false) trigger.removeAttribute("aria-expanded")
  else trigger.setAttribute("aria-expanded", String(state === "open"))
  trigger.dataset.state = state
  trigger.toggleAttribute("data-popup-open", state === "open")
  applyStateAttrs(trigger, state)
}

/**
 * Popover APIの開閉、退出アニメーション、位置決めだけを管理する。
 * 項目探索・キーボード操作・ARIA状態の意味付けは各controllerが担う。
 */
export class MenuPopoverManager {
  /**
   * @param {HTMLElement} root
   * @param {(popover: HTMLElement, state: "open" | "closed") => void} onStateChange
   */
  constructor(root, onStateChange) {
    this.root = root
    this.onStateChange = onStateChange
  }

  /** @type {HTMLElement[]} */
  popovers = []

  /** @type {Map<HTMLElement, () => void>} */
  pendingExits = new Map()

  /** @type {Map<HTMLElement, "open" | "closed">} */
  desiredStates = new Map()

  /** @type {HTMLElement | null} */
  pointerDownOpenTrigger = null

  /** @type {Map<HTMLElement, { update: () => void, destroy: () => void }>} */
  positionings = new Map()

  /** @type {(event: Event) => void} */
  onToggle = (event) => {
    if (event.currentTarget instanceof HTMLElement) this.sync(event.currentTarget)
  }

  connect() {
    this.cancelAllExits()
    this.stopAllPositioning()
    this.desiredStates.clear()
    this.pointerDownOpenTrigger = null
    this.popovers = ownedMenuElements(this.root, "[popover]")
    for (const popover of this.popovers) {
      popover.addEventListener("toggle", this.onToggle)
      const state = popover.matches(":popover-open") ? "open" : "closed"
      this.desiredStates.set(popover, state)
      this.applyState(popover, state)
    }
    connectedManagers.add(this)
  }

  disconnect() {
    connectedManagers.delete(this)
    this.cancelAllExits()
    this.stopAllPositioning()
    const popovers = this.popovers
    this.popovers = []
    for (const popover of popovers) {
      popover.removeEventListener("toggle", this.onToggle)
      if (popover.matches(":popover-open")) popover.hidePopover()
      this.applyState(popover, "closed")
    }
    this.desiredStates.clear()
    this.pointerDownOpenTrigger = null
  }

  /**
   * @param {HTMLElement} popover
   * @param {import("@supermomonga/shadcn-view-components/floating_position").Anchor | Element} anchor
   * @param {{side?: "top" | "right" | "bottom" | "left" | "inline-start" | "inline-end", align?: "start" | "center" | "end", sideOffset?: number, alignOffset?: number, collisionPadding?: number}} [placement]
   */
  show(popover, anchor, placement = {}) {
    this.closeUnrelatedMenus()
    if (popover.getAttribute("popover") === "manual") this.closeAutoPopovers(popover)
    this.desiredStates.set(popover, "open")
    this.cancelExit(popover)
    this.applyState(popover, "open")
    if (!popover.matches(":popover-open")) popover.showPopover()
    this.startPositioning(popover, anchor, placement)
  }

  /** @param {HTMLElement} popover */
  hide(popover) {
    this.closeDescendantMenus(popover)
    this.cancelExit(popover)
    this.desiredStates.set(popover, "closed")
    this.applyState(popover, "closed")
    if (!popover.matches(":popover-open")) {
      this.stopPositioning(popover)
      return
    }

    let completed = false
    const cancel = hideAfterExit(popover, () => {
      completed = true
      this.pendingExits.delete(popover)
      if (this.desiredStates.get(popover) === "open") return
      this.stopPositioning(popover)
      popover.hidePopover()
    })
    if (!completed) this.pendingExits.set(popover, cancel)
  }

  /** @param {HTMLElement[]} [except] */
  hideAll(except = []) {
    const exclusions = new Set(except)
    for (const popover of this.popovers) {
      if (!exclusions.has(popover) && this.isOpen(popover)) this.hide(popover)
    }
  }

  /** @param {HTMLElement} popover */
  isOpen(popover) {
    return popover.matches(":popover-open") && this.desiredStates.get(popover) === "open"
  }

  /** @returns {HTMLElement[]} */
  openPopovers() {
    return this.popovers.filter((popover) => this.isOpen(popover))
  }

  /** @param {Node} node @returns {boolean} */
  containsOpenPopover(node) {
    return this.openPopovers().some((popover) => popover.contains(node))
  }

  beginPointerDown() {
    this.pointerDownOpenTrigger = null
  }

  /** @param {PointerEvent} event @param {HTMLElement} popover @param {HTMLElement} trigger */
  recordOpenTriggerPointerDown(event, popover, trigger) {
    if (event.button === 0 && popover.getAttribute("popover") !== "manual" && this.isOpen(popover)) {
      this.pointerDownOpenTrigger = trigger
    }
  }

  /** @param {Event} event @param {HTMLElement} trigger @returns {boolean} */
  consumeOpenTriggerPointer(event, trigger) {
    const recorded = this.pointerDownOpenTrigger
    this.pointerDownOpenTrigger = null
    return event instanceof window.MouseEvent && event.detail > 0 && recorded === trigger
  }

  /** @param {HTMLElement} popover */
  sync(popover) {
    const state = popover.matches(":popover-open") ? "open" : "closed"
    if (state === "open" && this.desiredStates.get(popover) === "closed" && this.pendingExits.has(popover)) return

    this.desiredStates.set(popover, state)
    if (state === "open") {
      this.closeUnrelatedMenus()
      this.cancelExit(popover)
    } else {
      this.cancelExit(popover)
      this.stopPositioning(popover)
    }
    this.applyState(popover, state)
  }

  // manual popoverはブラウザのlight dismiss対象外なので、document内の
  // メニューrootを明示的に調停する。実際に開いたpopover内の子rootだけは維持する。
  closeUnrelatedMenus() {
    for (const manager of connectedManagers) {
      if (manager === this) continue
      if (manager.root.ownerDocument !== this.root.ownerDocument) continue
      // 現在開いている親popoverの中から子rootを開く場合だけ共存させる。
      // DOM上の祖先というだけでは、親の別メニューへ切り替えた際に子だけが残る。
      const ancestors = manager.openPopovers().filter((popover) => popover.contains(this.root))
      manager.hideAll(ancestors)
    }
  }

  /** @param {HTMLElement} popover */
  closeAutoPopovers(popover) {
    for (const candidate of popover.ownerDocument.querySelectorAll("[popover]")) {
      if (!(candidate instanceof HTMLElement)) continue
      if (candidate.getAttribute("popover") === "manual" || !candidate.matches(":popover-open")) continue
      if (candidate.contains(this.root)) continue
      candidate.hidePopover()
    }
  }

  /** @param {HTMLElement} popover */
  closeDescendantMenus(popover) {
    for (const manager of connectedManagers) {
      if (manager !== this && popover.contains(manager.root)) manager.hideAll()
    }
  }

  /** @param {HTMLElement} popover @param {"open" | "closed"} state */
  applyState(popover, state) {
    popover.dataset.state = state
    applyStateAttrs(popover, state)
    this.onStateChange(popover, state)
  }

  /** @param {HTMLElement} popover */
  cancelExit(popover) {
    this.pendingExits.get(popover)?.()
    this.pendingExits.delete(popover)
  }

  cancelAllExits() {
    for (const cancel of this.pendingExits.values()) cancel()
    this.pendingExits.clear()
  }

  /**
   * @param {HTMLElement} popover
   * @param {import("@supermomonga/shadcn-view-components/floating_position").Anchor | Element} anchor
   * @param {{side?: "top" | "right" | "bottom" | "left" | "inline-start" | "inline-end", align?: "start" | "center" | "end", sideOffset?: number, alignOffset?: number, collisionPadding?: number}} placement
   */
  startPositioning(popover, anchor, placement) {
    this.stopPositioning(popover)
    this.positionings.set(popover, startFloatingPosition({
      ...placement,
      anchor,
      collisionPadding: placement.collisionPadding ?? 5,
      floating: popover,
    }))
  }

  /** @param {HTMLElement} popover */
  stopPositioning(popover) {
    this.positionings.get(popover)?.destroy()
    this.positionings.delete(popover)
  }

  stopAllPositioning() {
    for (const positioning of this.positionings.values()) positioning.destroy()
    this.positionings.clear()
  }
}

/** @param {HTMLElement} element @param {string} prefix */
function ensureId(element, prefix) {
  if (element.id) return

  do {
    associationSequence += 1
    element.id = `${prefix}-${associationSequence}`
  } while (document.getElementById(element.id) !== element)
}
