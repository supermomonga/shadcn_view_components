import { Controller } from "@hotwired/stimulus"

import { pointAnchor, startFloatingPosition } from "@supermomonga/shadcn-view-components/floating_position"
import { hideAfterExit } from "@supermomonga/shadcn-view-components/hide_after_exit"
import { applyStateAttrs } from "@supermomonga/shadcn-view-components/state_attrs"

// ARIA menu パターンの共通実装(dropdown-menu / context-menu 共用 — 05 §4)。
// - 矢印 / Home / End でハイライト移動(roving)
// - Esc で閉じる、項目の activation で閉じる
// - context-menu は右クリック位置に開く
//
// 項目の操作はルート要素へのキャプチャフェースリスナーで一括処理する
// (popover の top layer 配下でも安定して動作させるため)
export default class MenuController extends Controller {
  /** @type {HTMLElement | null} */
  menu = null

  /** @type {Map<HTMLElement, () => void>} */
  pendingExits = new Map()

  /** @type {Map<HTMLElement, { update: () => void, destroy: () => void }>} */
  positionings = new Map()

  /** @type {HTMLElement[]} */
  popovers = []

  /** @type {(event: Event) => void} */
  onToggle = (event) => {
    const popover = event.currentTarget
    if (!(popover instanceof HTMLElement)) return

    if (!popover.matches(":popover-open")) this.stopPositioning(popover)
    if (popover === this.menu) this.syncState()
  }

  /** @type {(event: MouseEvent) => void} */
  onClick = (event) => {
    if (!(event.target instanceof Element)) return

    const item = event.target.closest("[role^='menuitem']")
    const subPopover = /** @type {HTMLElement | null | undefined} */ (
      item?.closest("[data-slot$='-sub'] [popover]")
    )
    const insideClosedSubmenu = Boolean(subPopover && !subPopover.matches(":popover-open"))
    if (item && !item.matches("[data-slot$='-sub-trigger']") && !insideClosedSubmenu) this.closeAll()
  }

  /** @type {(event: MouseEvent) => void} */
  onContextMenu = (event) => {
    if (event.target instanceof Element && event.target.closest("[data-slot='context-menu-trigger']")) {
      this.showAt(event)
    }
  }

  /** @type {(event: KeyboardEvent) => void} */
  onKeydown = (event) => this.navigate(event)

  /** @type {(event: PointerEvent) => void} */
  onDocPointerDown = (event) => {
    if (!(event.target instanceof Node)) return

    for (const element of this.root.querySelectorAll("[popover='manual']")) {
      const popover = /** @type {HTMLElement} */ (element)
      if (popover.matches(":popover-open") && !popover.contains(event.target)) {
        this.hidePopoverAfterExit(popover)
      }
    }
  }

  connect() {
    this.cancelAllExits()
    this.stopAllPositioning()
    // navigation-menu の content は role=menu を持たないため popover 属性のみで探す
    this.popovers = /** @type {HTMLElement[]} */ ([...this.root.querySelectorAll("[popover]")])
    this.menu = this.popovers[0] ?? null
    for (const popover of this.popovers) popover.addEventListener("toggle", this.onToggle)
    this.root.addEventListener("click", this.onClick, true)
    this.root.addEventListener("contextmenu", this.onContextMenu, true)
    this.root.addEventListener("keydown", this.onKeydown, true)
    document.addEventListener("pointerdown", this.onDocPointerDown)
    this.syncState()
  }

  disconnect() {
    const pendingPopovers = [...this.pendingExits.keys()]
    this.cancelAllExits()
    this.stopAllPositioning()
    for (const popover of this.popovers) popover.removeEventListener("toggle", this.onToggle)
    this.root.removeEventListener("click", this.onClick, true)
    this.root.removeEventListener("contextmenu", this.onContextMenu, true)
    this.root.removeEventListener("keydown", this.onKeydown, true)
    document.removeEventListener("pointerdown", this.onDocPointerDown)
    for (const popover of pendingPopovers) {
      if (popover.dataset.state === "closed" && popover.matches(":popover-open")) popover.hidePopover()
    }
    this.menu = null
    this.popovers = []
  }

  /** @returns {HTMLElement[]} */
  get items() {
    if (!this.menu) return []
    return /** @type {HTMLElement[]} */ (
      [...this.menu.querySelectorAll("[role^='menuitem']:not([disabled])")]
    )
  }

  /** @param {Event} event */
  toggle(event) {
    const menu = this.menu
    if (!menu) return

    const exiting = menu.dataset.state === "closed" && menu.matches(":popover-open")
    if (menu.matches(":popover-open") && !exiting) {
      this.hidePopoverAfterExit(menu)
    } else {
      const anchor = event.currentTarget instanceof Element ? event.currentTarget : undefined
      this.show(anchor)
    }
  }

  // context-menu: 右クリック位置に開く。content は popover="manual" で描かれるため
  // 右クリックイベント列による自動解散の影響を受けない(外側クリックは自前で閉じる)
  /** @param {MouseEvent} event */
  showAt(event) {
    if (!this.menu) return

    event.preventDefault()
    const contextElement = event.currentTarget instanceof Element ? event.currentTarget : undefined
    this.show(pointAnchor(event.clientX, event.clientY, contextElement), {
      align: "start",
      alignOffset: 4,
      side: "right",
      sideOffset: 0,
    })
  }

  // popover="manual" のcontent(右クリック)を開く。外側のpointerdownで閉じる
  /**
   * @param {import("@supermomonga/shadcn-view-components/floating_position").Anchor | Element} [anchor]
   * @param {{side?: "top" | "right" | "bottom" | "left" | "inline-start" | "inline-end", align?: "start" | "center" | "end", sideOffset?: number, alignOffset?: number}} [placement]
   */
  show(anchor, placement = {}) {
    const menu = this.menu
    if (!menu) return

    this.cancelExit(menu)
    menu.dataset.state = "open"
    applyStateAttrs(menu, "open")
    if (!menu.matches(":popover-open")) menu.showPopover()
    const resolvedAnchor = anchor ?? this.root.querySelector("[aria-haspopup='menu']")
    if (resolvedAnchor) {
      this.startPositioning(menu, resolvedAnchor, {
        align: placement.align ?? "start",
        alignOffset: placement.alignOffset ?? 0,
        side: placement.side ?? "bottom",
        sideOffset: placement.sideOffset ?? 4,
      })
    }
    this.focusItem(this.items[0])
  }

  /** @param {Event} event */
  toggleSub(event) {
    if (!(event.currentTarget instanceof Element)) return

    const sub = /** @type {HTMLElement | null | undefined} */ (
      event.currentTarget.closest("[data-slot$='-sub']")?.querySelector("[popover]")
    )
    if (!sub) return

    const exiting = sub.dataset.state === "closed" && sub.matches(":popover-open")
    if (sub.matches(":popover-open") && !exiting) {
      this.hidePopoverAfterExit(sub)
    } else {
      this.cancelExit(sub)
      sub.dataset.state = "open"
      applyStateAttrs(sub, "open")
      if (!sub.matches(":popover-open")) sub.showPopover()
      this.startPositioning(sub, event.currentTarget, {
        align: "start",
        alignOffset: -3,
        side: "right",
        sideOffset: 0,
      })
    }
  }

  activate() {
    this.closeAll()
  }

  /** @param {KeyboardEvent} event */
  navigate(event) {
    if (!this.menu?.matches(":popover-open")) return

    const keys = ["ArrowDown", "ArrowUp", "Home", "End", "Escape"]
    if (!keys.includes(event.key)) return
    event.preventDefault()

    const items = this.items
    if (event.key === "Escape") {
      this.closeAll()
      return
    }
    if (items.length === 0) return

    const current = items.findIndex((item) => item.dataset.highlighted === "true")
    let next = current
    if (event.key === "ArrowDown") next = (current + 1 + items.length) % items.length
    if (event.key === "ArrowUp") next = (current - 1 + items.length) % items.length
    if (event.key === "Home") next = 0
    if (event.key === "End") next = items.length - 1
    this.focusItem(items[Math.max(0, next)])
  }

  syncState() {
    if (!this.menu) return

    const state = this.menu.matches(":popover-open") ? "open" : "closed"
    if (state === "open") this.cancelExit(this.menu)
    this.menu.dataset.state = state
    applyStateAttrs(this.menu, state)
    for (const trigger of this.root.querySelectorAll("[aria-haspopup='menu']")) {
      trigger.setAttribute("aria-expanded", String(state === "open"))
    }
    if (state === "open") {
      if (!this.positionings.has(this.menu)) {
        const trigger = this.root.querySelector("[aria-haspopup='menu']")
        if (trigger) this.startPositioning(this.menu, trigger, { align: "start", side: "bottom", sideOffset: 4 })
      }
      this.focusItem(this.items[0])
    }
    if (state === "closed") this.stopPositioning(this.menu)
  }

  /** @param {HTMLElement | undefined} item */
  focusItem(item) {
    if (!item) return

    for (const candidate of this.items) {
      const highlighted = candidate === item
      candidate.dataset.highlighted = highlighted ? "true" : "false"
      candidate.tabIndex = highlighted ? 0 : -1
    }
    item.focus()
  }

  // 退出アニメーション(data-[state=closed]:animate-out)を待ってから閉じる。
  // 退出中に再オープンされた場合は閉じない
  /** @param {HTMLElement} popover */
  hidePopoverAfterExit(popover) {
    this.cancelExit(popover)
    if (!popover.matches(":popover-open")) return

    popover.dataset.state = "closed"
    applyStateAttrs(popover, "closed")
    // 退出アニメーション中も aria-expanded は即時に閉側へ
    for (const trigger of this.root.querySelectorAll("[aria-haspopup='menu']")) {
      trigger.setAttribute("aria-expanded", "false")
    }

    let completed = false
    /** @type {() => void} */
    const cancel = hideAfterExit(popover, () => {
      completed = true
      this.pendingExits.delete(popover)
      if (popover.dataset.state === "open") return
      this.stopPositioning(popover)
      popover.hidePopover()
    })
    if (!completed) this.pendingExits.set(popover, cancel)
  }

  closeAll() {
    for (const element of this.root.querySelectorAll("[popover]")) {
      const popover = /** @type {HTMLElement} */ (element)
      if (popover.matches(":popover-open")) this.hidePopoverAfterExit(popover)
    }
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
   * @param {HTMLElement} floating
   * @param {import("@supermomonga/shadcn-view-components/floating_position").Anchor | Element} anchor
   * @param {{side?: "top" | "right" | "bottom" | "left" | "inline-start" | "inline-end", align?: "start" | "center" | "end", sideOffset?: number, alignOffset?: number}} placement
   */
  startPositioning(floating, anchor, placement) {
    this.stopPositioning(floating)
    this.positionings.set(floating, startFloatingPosition({
      ...placement,
      anchor,
      collisionPadding: 5,
      floating,
    }))
  }

  /** @param {HTMLElement} floating */
  stopPositioning(floating) {
    this.positionings.get(floating)?.destroy()
    this.positionings.delete(floating)
  }

  stopAllPositioning() {
    for (const positioning of this.positionings.values()) positioning.destroy()
    this.positionings.clear()
  }

  /** @returns {HTMLElement} */
  get root() {
    return /** @type {HTMLElement} */ (this.element)
  }
}
