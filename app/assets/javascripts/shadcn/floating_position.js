/** @typedef {"top" | "right" | "bottom" | "left" | "inline-start" | "inline-end"} Side */
/** @typedef {"top" | "right" | "bottom" | "left"} PhysicalSide */
/** @typedef {"start" | "center" | "end"} Align */
/** @typedef {"ltr" | "rtl"} Direction */
/** @typedef {{ getBoundingClientRect: () => DOMRect | DOMRectReadOnly, contextElement?: Element }} Anchor */
/** @typedef {{ width: number, height: number }} FloatingSize */
/** @typedef {{ side: PhysicalSide, align: Align }} Placement */
/** @typedef {{ side: PhysicalSide, align: Align, coordinates: {x: number, y: number}, overflows: number[] }} EvaluatedPlacement */

/**
 * @typedef {object} PositionConfig
 * @property {Side} [side]
 * @property {Align} [align]
 * @property {number} [sideOffset]
 * @property {number} [alignOffset]
 * @property {number} [collisionPadding]
 * @property {Direction} [direction]
 * @property {{ width: number, height: number }} [viewport]
 */

/**
 * @typedef {object} FloatingPosition
 * @property {number} x
 * @property {number} y
 * @property {Side} side
 * @property {Align} align
 * @property {number} anchorWidth
 * @property {number} anchorHeight
 * @property {number} availableWidth
 * @property {number} availableHeight
 * @property {string} transformOrigin
 */

const SIDES = new Set(["top", "right", "bottom", "left", "inline-start", "inline-end"])
const ALIGNS = new Set(["start", "center", "end"])
/** @type {Record<PhysicalSide, PhysicalSide>} */
const OPPOSITE_SIDE = { bottom: "top", left: "right", right: "left", top: "bottom" }

/**
 * DOMから独立した座標計算。希望sideの主軸が衝突すると反対側へflipし、
 * align軸は反対alignを比較した後collision padding内へshiftする。
 *
 * @param {DOMRect | DOMRectReadOnly} anchorRect
 * @param {FloatingSize} floatingRect
 * @param {PositionConfig} [config]
 * @returns {FloatingPosition}
 */
export function computeFloatingPosition(anchorRect, floatingRect, config = {}) {
  const direction = parseDirection(config.direction ?? "ltr")
  const requestedSide = parseSide(config.side ?? "bottom")
  const requestedAlign = parseAlign(config.align ?? "center")
  const sideOffset = parseNumber(config.sideOffset ?? 0, "sideOffset")
  const alignOffset = parseNumber(config.alignOffset ?? 0, "alignOffset")
  const collisionPadding = parseNumber(config.collisionPadding ?? 5, "collisionPadding", 0)
  const viewport = config.viewport ?? { height: window.innerHeight, width: window.innerWidth }
  const viewportWidth = parseNumber(viewport.width, "viewport.width", 0)
  const viewportHeight = parseNumber(viewport.height, "viewport.height", 0)
  const preferredSide = physicalSide(requestedSide, direction)
  const placements = placementCandidates(preferredSide, requestedAlign, direction)
  const flipPadding = biasedCollisionPadding(requestedSide, collisionPadding)
  const evaluated = placements.map((placement) => evaluatePlacement(
    placement,
    anchorRect,
    floatingRect,
    sideOffset,
    alignOffset,
    direction,
    viewportWidth,
    viewportHeight,
    collisionPadding,
    flipPadding,
  ))
  const initialAxis = sideAxis(preferredSide)
  const initialAxisPlacements = evaluated.filter((placement) => sideAxis(placement.side) === initialAxis)
  const candidates = initialAxisPlacements.every((placement) => placement.overflows[0] > 0)
    ? evaluated
    : initialAxisPlacements
  const resolvedPlacement = selectPlacement(candidates, initialAxis)
  const {
    align: resolvedAlign,
    coordinates,
    side: resolvedPhysicalSide,
  } = resolvedPlacement

  // Base UIの既定shiftはalign軸だけをviewport内へ移動する。side軸はflipの結果を保つ。
  const shiftedCoordinates = shiftAlignAxis(
    coordinates,
    resolvedPhysicalSide,
    floatingRect,
    viewportWidth,
    viewportHeight,
    collisionPadding,
  )
  const { x, y } = shiftedCoordinates
  const side = outputSide(requestedSide, resolvedPhysicalSide, direction)
  const available = availableSize(
    resolvedPhysicalSide,
    anchorRect,
    viewportWidth,
    viewportHeight,
    collisionPadding,
    sideOffset,
  )

  return {
    align: resolvedAlign,
    anchorHeight: anchorRect.height,
    anchorWidth: anchorRect.width,
    availableHeight: available.height,
    availableWidth: available.width,
    side,
    transformOrigin: transformOrigin(
      resolvedPhysicalSide,
      resolvedAlign,
      sideOffset,
      direction,
      anchorRect,
      floatingRect,
      coordinates,
      x,
      y,
    ),
    x,
    y,
  }
}

/**
 * 浮動要素を配置し、scroll・resize・要素size・anchor移動へ追従する。
 * 入力data-position-*は引数より優先し、data-side/data-alignは実配置だけを表す。
 *
 * @param {{
 *   anchor: Anchor,
 *   floating: HTMLElement,
 *   side?: Side,
 *   align?: Align,
 *   sideOffset?: number,
 *   alignOffset?: number,
 *   collisionPadding?: number,
 *   direction?: Direction,
 * }} options
 * @returns {{ update: () => void, destroy: () => void }}
 */
export function startFloatingPosition(options) {
  const { anchor, floating } = options
  if (!anchor || typeof anchor.getBoundingClientRect !== "function") {
    throw new TypeError("anchor must provide getBoundingClientRect()")
  }
  if (!(floating instanceof HTMLElement)) throw new TypeError("floating must be an HTMLElement")

  const ownerDocument = floating.ownerDocument
  const ownerWindow = ownerDocument.defaultView ?? window
  const config = configFromElement(floating, options)
  let destroyed = false
  /** @type {number | undefined} */
  let animationFrame

  const update = () => {
    if (destroyed) return
    const anchorRect = anchor.getBoundingClientRect()
    const floatingRect = floatingLayoutSize(floating)
    const direction = config.direction ?? directionOf(anchor, floating, ownerWindow)
    const result = computeFloatingPosition(anchorRect, floatingRect, {
      ...config,
      direction,
      viewport: { height: ownerWindow.innerHeight, width: ownerWindow.innerWidth },
    })
    applyFloatingPosition(floating, result)
  }
  const scheduleUpdate = () => {
    if (destroyed || animationFrame !== undefined) return
    animationFrame = ownerWindow.requestAnimationFrame(() => {
      animationFrame = undefined
      update()
    })
  }

  update()
  ownerDocument.addEventListener("scroll", scheduleUpdate, true)
  ownerWindow.addEventListener("resize", scheduleUpdate)
  ownerWindow.visualViewport?.addEventListener("resize", scheduleUpdate)
  ownerWindow.visualViewport?.addEventListener("scroll", scheduleUpdate)

  /** @type {ResizeObserver | undefined} */
  let resizeObserver
  if (typeof ownerWindow.ResizeObserver === "function") {
    resizeObserver = new ownerWindow.ResizeObserver(scheduleUpdate)
    if (anchor instanceof Element) resizeObserver.observe(anchor)
    else if (anchor.contextElement) resizeObserver.observe(anchor.contextElement)
    resizeObserver.observe(floating)
  }

  const observedAnchor = anchor instanceof Element ? anchor : anchor.contextElement
  const stopMoveObserver = observedAnchor
    ? observeAnchorMove(observedAnchor, scheduleUpdate, ownerWindow)
    : () => {}

  const destroy = () => {
    if (destroyed) return
    destroyed = true
    ownerDocument.removeEventListener("scroll", scheduleUpdate, true)
    ownerWindow.removeEventListener("resize", scheduleUpdate)
    ownerWindow.visualViewport?.removeEventListener("resize", scheduleUpdate)
    ownerWindow.visualViewport?.removeEventListener("scroll", scheduleUpdate)
    resizeObserver?.disconnect()
    stopMoveObserver()
    if (animationFrame !== undefined) ownerWindow.cancelAnimationFrame(animationFrame)
    animationFrame = undefined
  }

  return { destroy, update }
}

/**
 * 開くanimationのtransformで縮小・移動した描画boxではなく、最終layout寸法を返す。
 * offset寸法が得られないDOM実装ではgetBoundingClientRect()へ戻す。
 *
 * @param {HTMLElement} floating
 * @returns {FloatingSize}
 */
function floatingLayoutSize(floating) {
  const renderedRect = floating.getBoundingClientRect()
  return {
    height: floating.offsetHeight || renderedRect.height,
    width: floating.offsetWidth || renderedRect.width,
  }
}

/**
 * Context Menu等のclient座標を通常anchorと同じinterfaceで扱う。
 *
 * @param {number} x
 * @param {number} y
 * @param {Element} [contextElement]
 * @returns {Anchor}
 */
export function pointAnchor(x, y, contextElement) {
  return {
    contextElement,
    getBoundingClientRect: () => DOMRect.fromRect({ height: 0, width: 0, x, y }),
  }
}

/** @param {HTMLElement} floating @param {FloatingPosition} position */
function applyFloatingPosition(floating, position) {
  const style = floating.style
  style.position = "fixed"
  style.margin = "0"
  style.left = `${formatNumber(position.x)}px`
  style.top = `${formatNumber(position.y)}px`
  style.setProperty("--anchor-width", `${formatNumber(position.anchorWidth)}px`)
  style.setProperty("--anchor-height", `${formatNumber(position.anchorHeight)}px`)
  style.setProperty("--available-width", `${formatNumber(position.availableWidth)}px`)
  style.setProperty("--available-height", `${formatNumber(position.availableHeight)}px`)
  style.setProperty("--transform-origin", position.transformOrigin)
  floating.dataset.side = position.side
  floating.dataset.align = position.align
}

/**
 * @param {HTMLElement} floating
 * @param {{ side?: Side, align?: Align, sideOffset?: number, alignOffset?: number, collisionPadding?: number, direction?: Direction }} defaults
 * @returns {PositionConfig}
 */
function configFromElement(floating, defaults) {
  return {
    align: parseAlign(floating.dataset.positionAlign ?? defaults.align ?? "center"),
    alignOffset: parseNumber(floating.dataset.positionAlignOffset ?? defaults.alignOffset ?? 0, "alignOffset"),
    collisionPadding: parseNumber(
      floating.dataset.positionCollisionPadding ?? defaults.collisionPadding ?? 5,
      "collisionPadding",
      0,
    ),
    direction: defaults.direction,
    side: parseSide(floating.dataset.positionSide ?? defaults.side ?? "bottom"),
    sideOffset: parseNumber(floating.dataset.positionSideOffset ?? defaults.sideOffset ?? 0, "sideOffset"),
  }
}

/**
 * IntersectionObserverのrootをanchorの現在位置へ絞り、sizeが不変のlayout shiftも検出する。
 * scroll/resizeは別購読なので、Observer非対応環境でも主要な追従経路は維持される。
 *
 * @param {Element} anchor
 * @param {() => void} onMove
 * @param {Window} ownerWindow
 * @returns {() => void}
 */
function observeAnchorMove(anchor, onMove, ownerWindow) {
  const Observer = /** @type {typeof IntersectionObserver | undefined} */ (
    Reflect.get(ownerWindow, "IntersectionObserver")
  )
  if (!Observer) return () => {}

  /** @type {IntersectionObserver | undefined} */
  let observer
  let stopped = false
  const observe = () => {
    observer?.disconnect()
    if (stopped) return
    const rect = anchor.getBoundingClientRect()
    const rootMargin = [
      -Math.floor(rect.top),
      -Math.floor(ownerWindow.innerWidth - rect.right),
      -Math.floor(ownerWindow.innerHeight - rect.bottom),
      -Math.floor(rect.left),
    ].map((value) => `${value}px`).join(" ")
    const observedRect = rect
    const nextObserver = new Observer(() => {
      const currentRect = anchor.getBoundingClientRect()
      if (!rectChanged(observedRect, currentRect)) return
      onMove()
      observe()
    }, { rootMargin, threshold: [0, 1] })
    observer = nextObserver
    nextObserver.observe(anchor)
  }
  observe()

  return () => {
    if (stopped) return
    stopped = true
    observer?.disconnect()
    observer = undefined
  }
}

/**
 * @param {PhysicalSide} side
 * @param {Align} align
 * @param {DOMRect | DOMRectReadOnly} anchor
 * @param {FloatingSize} floating
 * @param {number} sideOffset
 * @param {number} alignOffset
 * @param {Direction} direction
 */
function coordinatesFor(side, align, anchor, floating, sideOffset, alignOffset, direction) {
  if (side === "top" || side === "bottom") {
    return {
      x: alignedCoordinate(anchor.left, anchor.width, floating.width, align, alignOffset, direction === "rtl" ? -1 : 1),
      y: side === "top" ? anchor.top - floating.height - sideOffset : anchor.bottom + sideOffset,
    }
  }
  return {
    x: side === "left" ? anchor.left - floating.width - sideOffset : anchor.right + sideOffset,
    y: alignedCoordinate(anchor.top, anchor.height, floating.height, align, alignOffset, 1),
  }
}

/** @param {number} start @param {number} anchorSize @param {number} floatingSize @param {Align} align @param {number} offset @param {1 | -1} direction */
function alignedCoordinate(start, anchorSize, floatingSize, align, offset, direction) {
  if (align === "center") return start + (anchorSize - floatingSize) / 2 + direction * offset
  if (align === "start") return start + (direction === 1 ? 0 : anchorSize - floatingSize) + direction * offset
  return start + (direction === 1 ? anchorSize - floatingSize : 0) - direction * offset
}

/**
 * Floating UI flipと同じplacement順を構成する。align付きは希望/反対alignを
 * 同じside軸で試してから、fallback axis end側へ移る。
 *
 * @param {PhysicalSide} preferredSide
 * @param {Align} align
 * @param {Direction} direction
 * @returns {Placement[]}
 */
function placementCandidates(preferredSide, align, direction) {
  const oppositeSide = OPPOSITE_SIDE[preferredSide]
  const fallbackEnd = fallbackEndSide(preferredSide, direction)
  const fallbackOther = OPPOSITE_SIDE[fallbackEnd]
  if (align === "center") {
    return [preferredSide, oppositeSide, fallbackEnd, fallbackOther].map((side) => ({ align, side }))
  }

  const oppositeAlign = align === "start" ? "end" : "start"
  return [
    { align, side: preferredSide },
    { align: oppositeAlign, side: preferredSide },
    { align, side: oppositeSide },
    { align: oppositeAlign, side: oppositeSide },
    { align, side: fallbackEnd },
    { align, side: fallbackOther },
    { align: oppositeAlign, side: fallbackEnd },
    { align: oppositeAlign, side: fallbackOther },
  ]
}

/**
 * @param {Placement} placement
 * @param {DOMRect | DOMRectReadOnly} anchor
 * @param {FloatingSize} floating
 * @param {number} sideOffset
 * @param {number} alignOffset
 * @param {Direction} direction
 * @param {number} viewportWidth
 * @param {number} viewportHeight
 * @param {number} shiftPadding
 * @param {{top:number,right:number,bottom:number,left:number}} padding
 * @returns {EvaluatedPlacement}
 */
function evaluatePlacement(
  placement,
  anchor,
  floating,
  sideOffset,
  alignOffset,
  direction,
  viewportWidth,
  viewportHeight,
  shiftPadding,
  padding,
) {
  let coordinates = coordinatesFor(
    placement.side,
    placement.align,
    anchor,
    floating,
    sideOffset,
    alignOffset,
    direction,
  )
  // Base UIはcenterだけshiftをflipより先に適用し、shift後のoverflowで候補を選ぶ。
  if (placement.align === "center") {
    coordinates = shiftAlignAxis(
      coordinates,
      placement.side,
      floating,
      viewportWidth,
      viewportHeight,
      shiftPadding,
    )
  }
  const overflow = {
    bottom: coordinates.y + floating.height - (viewportHeight - padding.bottom),
    left: padding.left - coordinates.x,
    right: coordinates.x + floating.width - (viewportWidth - padding.right),
    top: padding.top - coordinates.y,
  }
  const [firstCrossSide, secondCrossSide] = alignmentSides(placement, anchor, floating, direction)
  return {
    ...placement,
    coordinates,
    overflows: [overflow[placement.side], overflow[firstCrossSide], overflow[secondCrossSide]],
  }
}

/**
 * @param {{x:number,y:number}} coordinates
 * @param {PhysicalSide} side
 * @param {FloatingSize} floating
 * @param {number} viewportWidth
 * @param {number} viewportHeight
 * @param {number} padding
 */
function shiftAlignAxis(coordinates, side, floating, viewportWidth, viewportHeight, padding) {
  const maxX = Math.max(padding, viewportWidth - padding - floating.width)
  const maxY = Math.max(padding, viewportHeight - padding - floating.height)
  return isVerticalSide(side)
    ? { x: clamp(coordinates.x, padding, maxX), y: coordinates.y }
    : { x: coordinates.x, y: clamp(coordinates.y, padding, maxY) }
}

/**
 * @param {EvaluatedPlacement[]} candidates
 * @param {"x" | "y"} initialAxis
 * @returns {EvaluatedPlacement}
 */
function selectPlacement(candidates, initialAxis) {
  const fullyVisible = candidates.find((candidate) => candidate.overflows.every((overflow) => overflow <= 0))
  if (fullyVisible) return fullyVisible

  const mainAxisFit = candidates
    .filter((candidate) => candidate.overflows[0] <= 0)
    .sort((first, second) => first.overflows[1] - second.overflows[1])[0]
  if (mainAxisFit) return mainAxisFit

  const preferred = candidates.filter((candidate) => {
    const currentAxis = sideAxis(candidate.side)
    return currentAxis === initialAxis || currentAxis === "y"
  })
  const bestFitCandidates = preferred.length > 0 ? preferred : candidates
  return bestFitCandidates
    .map((candidate) => ({
      candidate,
      score: candidate.overflows
        .filter((overflow) => overflow > 0)
        .reduce((total, overflow) => total + overflow, 0),
    }))
    .sort((first, second) => first.score - second.score)[0].candidate
}

/**
 * @param {Placement} placement
 * @param {DOMRect | DOMRectReadOnly} anchor
 * @param {FloatingSize} floating
 * @param {Direction} direction
 * @returns {[PhysicalSide, PhysicalSide]}
 */
function alignmentSides(placement, anchor, floating, direction) {
  /** @type {PhysicalSide} */
  let first
  if (isVerticalSide(placement.side)) {
    first = placement.align === (direction === "rtl" ? "end" : "start") ? "right" : "left"
    if (anchor.width > floating.width) first = OPPOSITE_SIDE[first]
  } else {
    first = placement.align === "start" ? "bottom" : "top"
    if (anchor.height > floating.height) first = OPPOSITE_SIDE[first]
  }
  return [first, OPPOSITE_SIDE[first]]
}

/** @param {Side} requestedSide @param {number} padding */
function biasedCollisionPadding(requestedSide, padding) {
  const result = { bottom: padding, left: padding, right: padding, top: padding }
  if (requestedSide === "top") result.bottom += 1
  if (requestedSide === "right") result.left += 1
  if (requestedSide === "bottom") result.top += 1
  if (requestedSide === "left") result.right += 1
  return result
}

/** @param {string} side @param {DOMRect | DOMRectReadOnly} anchor @param {number} width @param {number} height @param {number} padding @param {number} offset */
function availableSize(side, anchor, width, height, padding, offset) {
  if (side === "top") return { height: Math.max(0, anchor.top - padding - offset), width: Math.max(0, width - padding * 2) }
  if (side === "bottom") return { height: Math.max(0, height - padding - anchor.bottom - offset), width: Math.max(0, width - padding * 2) }
  if (side === "left") return { height: Math.max(0, height - padding * 2), width: Math.max(0, anchor.left - padding - offset) }
  return { height: Math.max(0, height - padding * 2), width: Math.max(0, width - padding - anchor.right - offset) }
}

/**
 * Base UIのarrowless transform-origin。start/endがcross軸でshiftされていなければ
 * aligned edge、centerまたはviewport内へshiftされた場合はanchor中心を使う。
 * side軸はanchorまでのoffsetを要素外の原点として含める。
 *
 * @param {PhysicalSide} side
 * @param {Align} align
 * @param {number} sideOffset
 * @param {Direction} direction
 * @param {DOMRect | DOMRectReadOnly} anchor
 * @param {FloatingSize} floating
 * @param {{x:number,y:number}} unshifted
 * @param {number} x
 * @param {number} y
 */
function transformOrigin(side, align, sideOffset, direction, anchor, floating, unshifted, x, y) {
  const verticalSide = isVerticalSide(side)
  const crossShift = verticalSide ? x - unshifted.x : y - unshifted.y
  let crossOrigin
  if (align !== "center" && Math.abs(crossShift) <= 1) {
    crossOrigin = alignedOrigin(align, verticalSide ? direction : "ltr")
  } else if (verticalSide) {
    crossOrigin = `${formatNumber(clamp(anchor.left + anchor.width / 2 - x, 0, floating.width))}px`
  } else {
    crossOrigin = `${formatNumber(clamp(anchor.top + anchor.height / 2 - y, 0, floating.height))}px`
  }

  const sideOrigin = sideAxisOrigin(side, sideOffset)
  return verticalSide ? `${crossOrigin} ${sideOrigin}` : `${sideOrigin} ${crossOrigin}`
}

/** @param {Align} align @param {Direction} direction */
function alignedOrigin(align, direction) {
  if (align === "center") return "50%"
  if (align === "start") return direction === "rtl" ? "100%" : "0%"
  return direction === "rtl" ? "0%" : "100%"
}

/** @param {PhysicalSide} side @param {number} sideOffset */
function sideAxisOrigin(side, sideOffset) {
  if (side === "top" || side === "left") {
    const operator = sideOffset < 0 ? "-" : "+"
    return `calc(100% ${operator} ${formatNumber(Math.abs(sideOffset))}px)`
  }
  return `${formatNumber(-sideOffset)}px`
}

/** @param {Side} side @param {Direction} direction @returns {PhysicalSide} */
function physicalSide(side, direction) {
  if (side === "inline-start") return direction === "rtl" ? "right" : "left"
  if (side === "inline-end") return direction === "rtl" ? "left" : "right"
  return side
}

/** @param {Side} requested @param {PhysicalSide} physical @param {Direction} direction @returns {Side} */
function outputSide(requested, physical, direction) {
  if (requested !== "inline-start" && requested !== "inline-end") return physical
  if (physical === physicalSide("inline-start", direction)) return "inline-start"
  if (physical === physicalSide("inline-end", direction)) return "inline-end"
  return physical
}

/**
 * 希望軸と反対側のどちらにも収まらない場合に最初に試す直交辺。
 * Base UIの既定fallback axis side="end"と同じ論理方向を物理辺へ解決する。
 *
 * @param {PhysicalSide} side
 * @param {Direction} direction
 * @returns {PhysicalSide}
 */
function fallbackEndSide(side, direction) {
  if (isVerticalSide(side)) return direction === "rtl" ? "left" : "right"
  return "bottom"
}

/** @param {PhysicalSide} side @returns {"x" | "y"} */
function sideAxis(side) {
  return isVerticalSide(side) ? "y" : "x"
}

/** @param {Anchor} anchor @param {HTMLElement} floating @param {Window} ownerWindow @returns {Direction} */
function directionOf(anchor, floating, ownerWindow) {
  const context = anchor instanceof Element ? anchor : (anchor.contextElement ?? floating)
  const direction = ownerWindow.getComputedStyle(context).direction || context.closest("[dir]")?.getAttribute("dir") || "ltr"
  return direction === "rtl" ? "rtl" : "ltr"
}

/** @param {unknown} value @returns {Side} */
function parseSide(value) {
  if (typeof value !== "string" || !SIDES.has(value)) throw new TypeError(`invalid floating side: ${String(value)}`)
  return /** @type {Side} */ (value)
}

/** @param {unknown} value @returns {Align} */
function parseAlign(value) {
  if (typeof value !== "string" || !ALIGNS.has(value)) throw new TypeError(`invalid floating align: ${String(value)}`)
  return /** @type {Align} */ (value)
}

/** @param {unknown} value @returns {Direction} */
function parseDirection(value) {
  if (value !== "ltr" && value !== "rtl") throw new TypeError(`invalid floating direction: ${String(value)}`)
  return value
}

/** @param {unknown} value @param {string} name @param {number} [minimum] */
function parseNumber(value, name, minimum = -Infinity) {
  const number = typeof value === "number" ? value : Number(value)
  if (!Number.isFinite(number) || number < minimum) throw new TypeError(`invalid floating ${name}: ${String(value)}`)
  return number
}

/** @param {number} value @param {number} minimum @param {number} maximum */
function clamp(value, minimum, maximum) {
  return Math.min(Math.max(value, minimum), maximum)
}

/** @param {string} side */
function isVerticalSide(side) {
  return side === "top" || side === "bottom"
}

/** @param {number} value */
function formatNumber(value) {
  return String(Math.round(value * 1000) / 1000)
}

/** @param {DOMRect | DOMRectReadOnly} before @param {DOMRect | DOMRectReadOnly} after */
function rectChanged(before, after) {
  return before.left !== after.left || before.top !== after.top ||
    before.width !== after.width || before.height !== after.height
}
