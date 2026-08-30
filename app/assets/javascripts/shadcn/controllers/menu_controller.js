import { Controller } from "@hotwired/stimulus"

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

  /** @type {() => void} */
  onToggle = () => this.syncState()

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
    // navigation-menu の content は role=menu を持たないため popover 属性のみで探す
    this.menu = this.element.querySelector("[popover]")
    this.menu?.addEventListener("toggle", this.onToggle)
    this.root.addEventListener("click", this.onClick, true)
    this.root.addEventListener("contextmenu", this.onContextMenu, true)
    this.root.addEventListener("keydown", this.onKeydown, true)
    document.addEventListener("pointerdown", this.onDocPointerDown)
    this.syncState()
  }

  disconnect() {
    const pendingPopovers = [...this.pendingExits.keys()]
    this.cancelAllExits()
    this.menu?.removeEventListener("toggle", this.onToggle)
    this.root.removeEventListener("click", this.onClick, true)
    this.root.removeEventListener("contextmenu", this.onContextMenu, true)
    this.root.removeEventListener("keydown", this.onKeydown, true)
    document.removeEventListener("pointerdown", this.onDocPointerDown)
    for (const popover of pendingPopovers) {
      if (popover.dataset.state === "closed" && popover.matches(":popover-open")) popover.hidePopover()
    }
    this.menu = null
  }

  /** @returns {HTMLElement[]} */
  get items() {
    if (!this.menu) return []
    return /** @type {HTMLElement[]} */ (
      [...this.menu.querySelectorAll("[role^='menuitem']:not([disabled])")]
    )
  }

  toggle() {
    const menu = this.menu
    if (!menu) return

    const exiting = menu.dataset.state === "closed" && menu.matches(":popover-open")
    if (menu.matches(":popover-open") && !exiting) {
      this.hidePopoverAfterExit(menu)
    } else {
      this.show()
    }
  }

  // context-menu: 右クリック位置に開く。content は popover="manual" で描かれるため
  // 右クリックイベント列による自動解散の影響を受けない(外側クリックは自前で閉じる)
  /** @param {MouseEvent} event */
  showAt(event) {
    if (!this.menu) return

    event.preventDefault()
    const style = this.menu.style
    style.position = "fixed"
    style.margin = "0"
    style.left = `${event.clientX}px`
    style.top = `${event.clientY}px`
    this.show()
    this.clampIntoViewport()
  }

  // 開いた後(popover=manual は display が復帰してから)にビューポート内へ収める。
  // 閉じた状態の offsetWidth は 0 のため、クランプは show の後にしか計算できない
  clampIntoViewport() {
    if (!this.menu) return

    const style = this.menu.style
    const left = Math.min(parseFloat(style.left), window.innerWidth - this.menu.offsetWidth - 8)
    const top = Math.min(parseFloat(style.top), window.innerHeight - this.menu.offsetHeight - 8)
    style.left = `${Math.max(8, left)}px`
    style.top = `${Math.max(8, top)}px`
  }

  // popover="manual" のcontent(右クリック)を開く。外側のpointerdownで閉じる
  show() {
    const menu = this.menu
    if (!menu) return

    this.cancelExit(menu)
    menu.dataset.state = "open"
    applyStateAttrs(menu, "open")
    menu.dataset.side = "bottom"
    if (!menu.matches(":popover-open")) menu.showPopover()
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
    if (state === "open" && !this.menu.style.left) {
      this.positionBelow(this.root.querySelector("[aria-haspopup='menu']"))
      this.focusItem(this.items[0])
    }
    if (state === "closed") this.menu.style.left = ""
  }

  /** @param {Element | null} trigger */
  positionBelow(trigger) {
    if (!trigger || !this.menu) return

    // upstream(Radix)は配置に応じて data-side を設定する。slide-in 系の起点になる
    this.menu.dataset.side = "bottom"
    const rect = trigger.getBoundingClientRect()
    const style = this.menu.style
    style.position = "fixed"
    style.margin = "0"
    style.left = `${Math.max(8, Math.min(rect.left, window.innerWidth - this.menu.offsetWidth - 8))}px`
    style.top = `${rect.bottom + 4}px`
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

  /** @returns {HTMLElement} */
  get root() {
    return /** @type {HTMLElement} */ (this.element)
  }
}
