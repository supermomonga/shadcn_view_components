import { Controller } from "@hotwired/stimulus"

// ARIA menu パターンの共通実装(dropdown-menu / context-menu 共用 — 05 §4)。
// - 矢印 / Home / End でハイライト移動(roving)
// - Esc で閉じる、項目の activation で閉じる
// - context-menu は右クリック位置に開く
//
// 項目の操作はルート要素へのキャプチャフェースリスナーで一括処理する
// (popover の top layer 配下でも安定して動作させるため)
export default class MenuController extends Controller {
  connect() {
    // navigation-menu の content は role=menu を持たないため popover 属性のみで探す
    this.menu = this.element.querySelector("[popover]")
    if (this.menu) {
      this.onToggle = () => this.syncState()
      this.menu.addEventListener("toggle", this.onToggle)
    }
    this.onClick = (event) => {
      const item = event.target.closest("[role^='menuitem']")
      if (item && !item.matches("[data-slot$='-sub-trigger']") && !item.closest("[data-slot$='-sub'] [popover]:not(:popover-open)")) {
        this.closeAll()
      }
    }
    this.onContextMenu = (event) => {
      if (event.target.closest("[data-slot='context-menu-trigger']")) this.showAt(event)
    }
    this.onKeydown = (event) => this.navigate(event)
    this.element.addEventListener("click", this.onClick, true)
    this.element.addEventListener("contextmenu", this.onContextMenu, true)
    this.element.addEventListener("keydown", this.onKeydown, true)
    this.onDocPointerDown = (event) => {
      for (const popover of this.element.querySelectorAll("[popover='manual']")) {
        if (popover.matches(":popover-open") && !popover.contains(event.target)) popover.hidePopover()
      }
    }
    document.addEventListener("pointerdown", this.onDocPointerDown)
  }

  disconnect() {
    this.menu?.removeEventListener("toggle", this.onToggle)
    this.element.removeEventListener("click", this.onClick, true)
    this.element.removeEventListener("contextmenu", this.onContextMenu, true)
    this.element.removeEventListener("keydown", this.onKeydown, true)
    document.removeEventListener("pointerdown", this.onDocPointerDown)
  }

  get items() {
    return [...(this.menu?.querySelectorAll("[role^='menuitem']:not([disabled])") ?? [])]
  }

  toggle() {
    this.menu?.togglePopover()
  }

  // context-menu: 右クリック位置に開く。content は popover="manual" で描かれるため
  // 右クリックイベント列による自動解散の影響を受けない(外側クリックは自前で閉じる)
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
    if (this.menu && !this.menu.matches(":popover-open")) this.menu.showPopover()
    this.focusItem(this.items[0])
  }

  toggleSub(event) {
    const sub = event.currentTarget.closest("[data-slot$='-sub']")?.querySelector("[popover]")
    sub?.togglePopover()
  }

  activate() {
    this.closeAll()
  }

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
    this.menu.dataset.state = state
    for (const trigger of this.element.querySelectorAll("[aria-haspopup='menu']")) {
      trigger.setAttribute("aria-expanded", String(state === "open"))
    }
    if (state === "open" && !this.menu.style.left) {
      this.positionBelow(this.element.querySelector("[aria-haspopup='menu']"))
      this.focusItem(this.items[0])
    }
    if (state === "closed") this.menu.style.left = ""
  }

  positionBelow(trigger) {
    if (!trigger || !this.menu) return
    const rect = trigger.getBoundingClientRect()
    const style = this.menu.style
    style.position = "fixed"
    style.margin = "0"
    style.left = `${Math.max(8, Math.min(rect.left, window.innerWidth - this.menu.offsetWidth - 8))}px`
    style.top = `${rect.bottom + 4}px`
  }

  focusItem(item) {
    if (!item) return
    for (const candidate of this.items) {
      const highlighted = candidate === item
      candidate.dataset.highlighted = highlighted ? "true" : "false"
      candidate.tabIndex = highlighted ? 0 : -1
    }
    item.focus()
  }

  closeAll() {
    for (const popover of this.element.querySelectorAll("[popover]")) {
      if (popover.matches(":popover-open")) popover.hidePopover()
    }
  }
}
