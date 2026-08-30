import { Controller } from "@hotwired/stimulus"

import {
  ensureId,
  ensureRootId,
  ownedElements,
  setDefaultAttribute,
} from "@supermomonga/shadcn-view-components/aria_relationships"

const IDENTIFIER = "shadcn--carousel"
const POSITION_TOLERANCE = 1
const rtlScrollTypes = new WeakMap()

/** @typedef {"negative" | "positive-ascending" | "positive-descending"} RtlScrollType */

/** @param {number} value @param {number} maximum */
function clampPosition(value, maximum) {
  const limit = Math.max(0, maximum)
  return Math.min(limit, Math.max(0, Number.isFinite(value) ? value : 0))
}

/**
 * RTLブラウザごとに異なるscrollLeftを、inline-startを0とする論理位置へ変換する。
 * Safariのoverscrollを含む範囲外値も0..maximumへ丸める。
 *
 * @param {number} raw
 * @param {number} maximum
 * @param {RtlScrollType} type
 */
export function logicalRtlScrollLeft(raw, maximum, type) {
  if (type === "negative") return clampPosition(-raw, maximum)
  if (type === "positive-descending") return clampPosition(maximum - raw, maximum)
  return clampPosition(raw, maximum)
}

/** @param {number} logical @param {number} maximum @param {RtlScrollType} type */
export function rawRtlScrollLeft(logical, maximum, type) {
  const position = clampPosition(logical, maximum)
  if (type === "negative") return position === 0 ? 0 : -position
  if (type === "positive-descending") return maximum - position
  return position
}

/** @param {Document} ownerDocument @returns {RtlScrollType} */
export function detectRtlScrollType(ownerDocument) {
  const viewport = ownerDocument.createElement("div")
  const content = ownerDocument.createElement("div")
  viewport.dir = "rtl"
  viewport.style.cssText = "position:absolute;top:-9999px;width:4px;height:1px;overflow:scroll;visibility:hidden"
  content.style.width = "8px"
  content.style.height = "1px"
  viewport.append(content)
  ;(ownerDocument.body || ownerDocument.documentElement).append(viewport)

  /** @type {RtlScrollType} */
  let type
  if (viewport.scrollLeft > 0) {
    type = "positive-descending"
  } else {
    viewport.scrollLeft = 1
    type = viewport.scrollLeft === 0 ? "negative" : "positive-ascending"
  }

  viewport.remove()
  return type
}

/** @param {Document} ownerDocument @returns {RtlScrollType} */
function rtlScrollType(ownerDocument) {
  const cached = rtlScrollTypes.get(ownerDocument)
  if (cached) return cached

  const detected = detectRtlScrollType(ownerDocument)
  rtlScrollTypes.set(ownerDocument, detected)
  return detected
}

// Carouselルートをorientation/directionの唯一の情報源とし、実レイアウトから
// 各itemの絶対snap位置を測る。生scrollLeftに依存する判断はRTL変換関数へ集約する。
/** @extends {Controller<HTMLElement>} */
export default class CarouselController extends Controller {
  /** @type {HTMLElement | null} */
  viewport = null

  /** @type {HTMLElement | null} */
  track = null

  /** @type {HTMLElement[]} */
  items = []

  /** @type {HTMLButtonElement | null} */
  previous = null

  /** @type {HTMLButtonElement | null} */
  next = null

  /** @type {ResizeObserver | null} */
  resizeObserver = null

  /** @type {number[]} */
  snapPositions = []

  /** @type {RtlScrollType | null} */
  rtlType = null

  onScroll = () => this.refreshState()

  onResize = () => this.refreshLayout()

  connect() {
    this.viewport = /** @type {HTMLElement | null} */ (
      ownedElements(this.element, "[data-slot='carousel-content']", IDENTIFIER)[0] ?? null
    )
    this.items = ownedElements(this.element, "[data-slot='carousel-item']", IDENTIFIER)
    this.previous = /** @type {HTMLButtonElement | null} */ (
      ownedElements(this.element, "button[data-slot='carousel-previous']", IDENTIFIER)[0] ?? null
    )
    this.next = /** @type {HTMLButtonElement | null} */ (
      ownedElements(this.element, "button[data-slot='carousel-next']", IDENTIFIER)[0] ?? null
    )
    this.track = /** @type {HTMLElement | null} */ (this.viewport?.firstElementChild ?? null)
    this.rtlType = this.horizontal && this.rtl
      ? rtlScrollType(this.element.ownerDocument)
      : null

    if (!this.viewport) {
      this.refreshState()
      return
    }

    this.ensureRelationships()
    this.viewport.addEventListener("scroll", this.onScroll, { passive: true })
    this.observeLayout()
    this.refreshLayout()
  }

  disconnect() {
    this.viewport?.removeEventListener("scroll", this.onScroll)
    this.resizeObserver?.disconnect()

    this.viewport = null
    this.track = null
    this.items = []
    this.previous = null
    this.next = null
    this.resizeObserver = null
    this.snapPositions = []
    this.rtlType = null
  }

  scrollPrevious() {
    this.scrollToAdjacent(-1)
  }

  scrollNext() {
    this.scrollToAdjacent(1)
  }

  /** @param {KeyboardEvent} event */
  navigate(event) {
    if (!this.ownsEvent(event) || this.editableTarget(event.target)) return

    let direction = 0
    if (this.vertical) {
      if (event.key === "ArrowUp") direction = -1
      if (event.key === "ArrowDown") direction = 1
    } else if (this.rtl) {
      if (event.key === "ArrowRight") direction = -1
      if (event.key === "ArrowLeft") direction = 1
    } else {
      if (event.key === "ArrowLeft") direction = -1
      if (event.key === "ArrowRight") direction = 1
    }

    if (direction === 0) return
    event.preventDefault()
    this.scrollToAdjacent(direction)
  }

  /** @param {number} direction */
  scrollToAdjacent(direction) {
    const viewport = this.viewport
    if (!viewport || this.items.length < 2) return

    // action直前にも測り直し、ResizeObserver通知と同じframeで寸法が変わった場合も
    // 古いitem幅・高さを使わない。
    this.snapPositions = this.measureSnapPositions()
    const current = this.logicalPosition
    const target = direction > 0
      ? this.snapPositions.find((position) => position > current + POSITION_TOLERANCE)
      : [...this.snapPositions].reverse().find((position) => position < current - POSITION_TOLERANCE)
    if (target === undefined) return

    if (this.vertical) {
      viewport.scrollTo({ behavior: "smooth", top: target })
    } else {
      viewport.scrollTo({ behavior: "smooth", left: this.rawHorizontalPosition(target) })
    }
  }

  refreshLayout() {
    this.snapPositions = this.measureSnapPositions()
    this.refreshState()
  }

  refreshState() {
    const movable = Boolean(this.viewport) && this.items.length > 1 && this.maximum > POSITION_TOLERANCE
    const position = this.logicalPosition
    if (this.previous) this.previous.disabled = !movable || position <= POSITION_TOLERANCE
    if (this.next) this.next.disabled = !movable || position >= this.maximum - POSITION_TOLERANCE
  }

  observeLayout() {
    const ownerWindow = this.element.ownerDocument.defaultView
    if (!this.viewport || typeof ownerWindow?.ResizeObserver !== "function") return

    this.resizeObserver = new ownerWindow.ResizeObserver(this.onResize)
    this.resizeObserver.observe(this.viewport)
    if (this.track) this.resizeObserver.observe(this.track)
    for (const item of this.items) this.resizeObserver.observe(item)
  }

  ensureRelationships() {
    if (!this.viewport) return

    const rootId = ensureRootId(this.element, "carousel")
    const viewportId = ensureId(this.viewport, `${rootId}-viewport`)
    if (this.previous) setDefaultAttribute(this.previous, "aria-controls", viewportId)
    if (this.next) setDefaultAttribute(this.next, "aria-controls", viewportId)
  }

  /** @returns {number[]} */
  measureSnapPositions() {
    if (!this.viewport || this.items.length === 0) return []

    const first = this.items[0].getBoundingClientRect()
    const positions = this.items.map((item) => {
      const rect = item.getBoundingClientRect()
      const distance = this.vertical
        ? rect.top - first.top
        : this.rtl
          ? first.right - rect.right
          : rect.left - first.left
      return clampPosition(distance, this.maximum)
    })
    positions.push(0, this.maximum)
    positions.sort((left, right) => left - right)

    return positions.filter(
      (position, index) => index === 0 || position - positions[index - 1] > POSITION_TOLERANCE,
    )
  }

  /** @param {Event} event */
  ownsEvent(event) {
    const target = event.target
    return target instanceof Element && target.closest(`[data-controller~='${IDENTIFIER}']`) === this.element
  }

  /** @param {EventTarget | null} target */
  editableTarget(target) {
    return target instanceof Element && Boolean(
      target.closest("input, textarea, select, [contenteditable]:not([contenteditable='false'])"),
    )
  }

  /** @param {number} logical */
  rawHorizontalPosition(logical) {
    if (!this.rtl || !this.rtlType) return clampPosition(logical, this.maximum)
    return rawRtlScrollLeft(logical, this.maximum, this.rtlType)
  }

  /** @returns {number} */
  get logicalPosition() {
    const viewport = this.viewport
    if (!viewport) return 0
    if (this.vertical) return clampPosition(viewport.scrollTop, this.maximum)
    if (!this.rtl || !this.rtlType) return clampPosition(viewport.scrollLeft, this.maximum)
    return logicalRtlScrollLeft(viewport.scrollLeft, this.maximum, this.rtlType)
  }

  /** @returns {number} */
  get maximum() {
    const viewport = this.viewport
    if (!viewport) return 0
    return this.vertical
      ? Math.max(0, viewport.scrollHeight - viewport.clientHeight)
      : Math.max(0, viewport.scrollWidth - viewport.clientWidth)
  }

  /** @returns {boolean} */
  get vertical() {
    return this.element.dataset.orientation === "vertical"
  }

  /** @returns {boolean} */
  get horizontal() {
    return !this.vertical
  }

  /** @returns {boolean} */
  get rtl() {
    return this.element.dir === "rtl"
  }
}
