import { Controller } from "@hotwired/stimulus"

import {
  ensureId,
  ensureRootId,
  ownedElements,
  setDefaultAttribute,
} from "@supermomonga/shadcn-view-components/aria_relationships"

const CONTROLLER = "shadcn--resizable"
const DEFAULT_MIN = 10
const DEFAULT_MAX = 90
const STEP = 5

/**
 * @typedef {object} DragState
 * @property {HTMLElement} before
 * @property {HTMLElement} after
 * @property {HTMLElement} handle
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

  connect() {
    this.ensureRelationships()
    for (const handle of this.handles) this.syncValue(handle)
  }

  disconnect() {
    this.endDrag()
  }

  /**
   * @param {Event} event
   * @returns {HTMLElement | null}
   */
  handleFor(event) {
    if (!(event.currentTarget instanceof Element)) return null
    const handle = /** @type {HTMLElement | null} */ (
      event.currentTarget.closest("[data-slot='resizable-handle']")
    )
    if (!handle || handle.closest(`[data-controller~='${CONTROLLER}']`) !== this.element) return null

    this.ensureHandleRelationship(handle)
    return handle
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
    if (group !== this.element) return null
    const panels = this.panels
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
      handle,
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
    const { before, after, handle, vertical, ratio, start } = this.dragging
    const group = /** @type {HTMLElement | null} */ (
      before.closest("[data-slot='resizable-panel-group']")
    )
    if (!group) return
    const rect = group.getBoundingClientRect()
    const size = vertical ? rect.height : rect.width
    if (size === 0) return
    const delta = ((vertical ? event.clientY : event.clientX) - start) / size
    this.applySplit(handle, before, after, this.clampRatio(handle, ratio + delta))
  }

  /** @param {KeyboardEvent} event */
  nudge(event) {
    const handle = this.handleFor(event)
    const pair = handle && this.pairFor(handle)
    if (!pair) return
    const vertical = this.isVerticalGroup(handle)
    const keys = vertical ? ["ArrowUp", "ArrowDown"] : ["ArrowLeft", "ArrowRight"]
    if (![...keys, "Home", "End"].includes(event.key)) return
    event.preventDefault()

    const { min, max } = this.limitsFor(handle)
    let next
    if (event.key === "Home") next = min / 100
    else if (event.key === "End") next = max / 100
    else {
      const positive = vertical ? event.key === "ArrowDown" : event.key === "ArrowRight"
      next = this.currentRatio(pair.before, pair.after, handle) + (positive ? STEP : -STEP) / 100
    }
    this.applySplit(handle, pair.before, pair.after, this.clampRatio(handle, next))
  }

  // %指定済みならそれを、初期レイアウトでは実寸を読み取る。jsdom等で寸法を
  // 得られない場合だけSSR済みaria-valuenow（既定50）へ戻る。
  /** @param {HTMLElement} before @param {HTMLElement} after @param {HTMLElement} handle */
  currentRatio(before, after, handle) {
    const basis = before.style.flexBasis
    if (basis.endsWith("%")) {
      const percent = parseFloat(basis)
      if (Number.isFinite(percent) && percent > 0) return percent / 100
    }

    const beforeRect = before.getBoundingClientRect()
    const afterRect = after.getBoundingClientRect()
    const vertical = this.isVerticalGroup(handle)
    const beforeSize = vertical ? beforeRect.height : beforeRect.width
    const afterSize = vertical ? afterRect.height : afterRect.width
    if (beforeSize + afterSize > 0) return beforeSize / (beforeSize + afterSize)

    const value = Number.parseFloat(handle.getAttribute("aria-valuenow") ?? "")
    return Number.isFinite(value) ? value / 100 : 0.5
  }

  /**
   * @param {HTMLElement} handle
   * @param {HTMLElement} before
   * @param {HTMLElement} after
   * @param {number} ratio
   */
  applySplit(handle, before, after, ratio) {
    before.style.flexBasis = `${ratio * 100}%`
    before.style.flexGrow = "0"
    after.style.flexBasis = `${(1 - ratio) * 100}%`
    after.style.flexGrow = "0"
    handle.setAttribute("aria-valuenow", this.percentValue(ratio))
  }

  ensureRelationships() {
    const rootId = ensureRootId(this.element, "resizable")
    this.panels.forEach((panel, index) => ensureId(panel, `${rootId}-panel-${index + 1}`))
    this.handles.forEach((handle, index) => {
      ensureId(handle, `${rootId}-handle-${index + 1}`)
      this.ensureHandleRelationship(handle)
    })
  }

  /** @param {HTMLElement} handle */
  ensureHandleRelationship(handle) {
    const pair = this.pairFor(handle)
    if (!pair) return

    const rootId = ensureRootId(this.element, "resizable")
    const panelIndex = this.panels.indexOf(pair.before)
    ensureId(pair.before, `${rootId}-panel-${panelIndex + 1}`)
    setDefaultAttribute(handle, "aria-controls", pair.before.id)
    setDefaultAttribute(handle, "aria-valuemin", String(DEFAULT_MIN))
    setDefaultAttribute(handle, "aria-valuemax", String(DEFAULT_MAX))
    setDefaultAttribute(handle, "aria-valuenow", "50")
  }

  /** @param {HTMLElement} handle */
  syncValue(handle) {
    const pair = this.pairFor(handle)
    if (!pair) return

    const ratio = this.currentRatio(pair.before, pair.after, handle)
    handle.setAttribute("aria-valuenow", this.percentValue(ratio))
  }

  /** @param {HTMLElement} handle */
  limitsFor(handle) {
    const rawMin = Number.parseFloat(handle.getAttribute("aria-valuemin") ?? "")
    const rawMax = Number.parseFloat(handle.getAttribute("aria-valuemax") ?? "")
    const min = Number.isFinite(rawMin) ? rawMin : DEFAULT_MIN
    const max = Number.isFinite(rawMax) && rawMax > min ? rawMax : DEFAULT_MAX
    return { min, max }
  }

  /** @param {HTMLElement} handle @param {number} ratio */
  clampRatio(handle, ratio) {
    const { min, max } = this.limitsFor(handle)
    return Math.min(max / 100, Math.max(min / 100, ratio))
  }

  /** @param {number} ratio */
  percentValue(ratio) {
    return String(Math.round(ratio * 10000) / 100)
  }

  /** @returns {HTMLElement[]} */
  get panels() {
    return ownedElements(this.element, ":scope > [data-slot='resizable-panel']", CONTROLLER)
  }

  /** @returns {HTMLElement[]} */
  get handles() {
    return ownedElements(this.element, ":scope > [data-slot='resizable-handle']", CONTROLLER)
  }
}
