import { Controller } from "@hotwired/stimulus"

/**
 * @typedef {object} DragState
 * @property {HTMLElement} before
 * @property {HTMLElement} after
 * @property {boolean} vertical
 * @property {number} ratio
 * @property {number} start
 */

// ハンドルのドラッグ/矢印キーで前後パネルの flex-basis を配分する
/** @extends {Controller<HTMLElement>} */
export default class ResizableController extends Controller {
  /** @type {DragState | null} */
  dragging = null

  /** @type {(event: MouseEvent) => void} */
  onMove = (event) => this.drag(event)

  onUp = () => this.endDrag()

  disconnect() {
    this.endDrag()
  }

  /**
   * @param {Event} event
   * @returns {HTMLElement | null}
   */
  handleFor(event) {
    if (!(event.currentTarget instanceof Element)) return null
    return /** @type {HTMLElement | null} */ (
      event.currentTarget.closest("[data-slot='resizable-handle']")
    )
  }

  // セパレータ自身が horizontal のとき縦積みグループ(上下方向にリサイズ)。
  // aria-orientation はセパレータの向きであり、グループの向きの逆
  /** @param {HTMLElement} handle */
  isVerticalGroup(handle) {
    return handle.getAttribute("aria-orientation") === "horizontal"
  }

  // 前後の対はハンドルより手前に何個パネルがあるかで決める
  // (子要素全体の index だとハンドル数が挟まる3パネル以上で対がずれる)
  /**
   * @param {HTMLElement | null} handle
   * @returns {{ before: HTMLElement, after: HTMLElement } | null}
   */
  pairFor(handle) {
    if (!handle) return null
    const group = handle.closest("[data-slot='resizable-panel-group']")
    if (!group) return null
    const panels = /** @type {HTMLElement[]} */ (
      [...group.querySelectorAll(":scope > [data-slot='resizable-panel']")]
    )
    let count = 0
    for (let el = handle.previousElementSibling; el; el = el.previousElementSibling) {
      if (el.matches("[data-slot='resizable-panel']")) count++
    }
    const before = panels[count - 1]
    const after = panels[count]
    return before && after ? { before, after } : null
  }

  /** @param {MouseEvent} event */
  startDrag(event) {
    const handle = this.handleFor(event)
    if (!handle) return
    const pair = this.pairFor(handle)
    if (!pair) return
    event.preventDefault()
    // preventDefaultするとフォーカス移動が阻害されるため明示的に移す(キーボード操作のため)
    handle.focus()

    // 同じcontrollerでdragを開始し直した場合もlistenerを重複させない。
    this.endDrag()

    // 開始時の比率を基準に以降は移動量だけで追従する
    // (カーソルの絶対位置をそのまま比率にすると、掴んだ瞬間パネルが跳ぶ)
    const vertical = this.isVerticalGroup(handle)
    const beforeRect = pair.before.getBoundingClientRect()
    const afterRect = pair.after.getBoundingClientRect()
    const beforeSize = vertical ? beforeRect.height : beforeRect.width
    const total = beforeSize + (vertical ? afterRect.height : afterRect.width) || 1
    this.dragging = {
      ...pair,
      vertical,
      ratio: beforeSize / total,
      start: vertical ? event.clientY : event.clientX,
    }
    document.addEventListener("mousemove", this.onMove)
    document.addEventListener("mouseup", this.onUp)
  }

  endDrag() {
    document.removeEventListener("mousemove", this.onMove)
    document.removeEventListener("mouseup", this.onUp)
    this.dragging = null
  }

  /** @param {MouseEvent} event */
  drag(event) {
    if (!this.dragging) return
    const { before, after, vertical, ratio, start } = this.dragging
    const group = /** @type {HTMLElement | null} */ (
      before.closest("[data-slot='resizable-panel-group']")
    )
    if (!group) return
    const rect = group.getBoundingClientRect()
    const size = vertical ? rect.height : rect.width
    if (size === 0) return
    const delta = ((vertical ? event.clientY : event.clientX) - start) / size
    this.applySplit(before, after, Math.min(0.9, Math.max(0.1, ratio + delta)))
  }

  /** @param {KeyboardEvent} event */
  nudge(event) {
    const handle = this.handleFor(event)
    const pair = handle && this.pairFor(handle)
    if (!pair) return
    const vertical = this.isVerticalGroup(handle)
    const keys = vertical ? ["ArrowUp", "ArrowDown"] : ["ArrowLeft", "ArrowRight"]
    if (!keys.includes(event.key)) return
    event.preventDefault()

    const positive = vertical ? event.key === "ArrowDown" : event.key === "ArrowRight"
    const next = Math.min(0.9, Math.max(0.1, this.currentRatio(pair.before) + (positive ? 0.05 : -0.05)))
    this.applySplit(pair.before, pair.after, next)
  }

  // 均等割りの既定は 0.5。flex-basis は % 表記のときだけ信頼する(0 等は 0.5 扱い)
  /** @param {HTMLElement} before */
  currentRatio(before) {
    const basis = before.style.flexBasis
    return basis.endsWith("%") ? parseFloat(basis) / 100 : 0.5
  }

  /**
   * @param {HTMLElement} before
   * @param {HTMLElement} after
   * @param {number} ratio
   */
  applySplit(before, after, ratio) {
    before.style.flexBasis = `${ratio * 100}%`
    before.style.flexGrow = "0"
    after.style.flexBasis = `${(1 - ratio) * 100}%`
    after.style.flexGrow = "0"
  }
}
