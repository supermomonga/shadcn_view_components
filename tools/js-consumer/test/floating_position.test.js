import { readFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

import { beforeEach, describe, expect, it, vi } from "vitest"

import {
  computeFloatingPosition,
  pointAnchor,
  startFloatingPosition,
} from "@supermomonga/shadcn-view-components/floating_position"

import {
  intersectionObserverCount,
  notifyAnchorMove,
  notifyResize,
  resizeObserverCount,
} from "./support/browser.js"
import { listenerCount } from "./support/listener_ledger.js"

const testRoot = path.dirname(fileURLToPath(import.meta.url))
const controllerRoot = path.join(testRoot, "../fixture/vendor/shadcn-view-components/controllers")

function rect(x, y, width, height) {
  return DOMRect.fromRect({ height, width, x, y })
}

function metrics(element, current) {
  element.getBoundingClientRect = () => rect(current.x, current.y, current.width, current.height)
}

function config(overrides = {}) {
  return { collisionPadding: 5, viewport: { height: 200, width: 300 }, ...overrides }
}

describe("computeFloatingPosition", () => {
  const anchor = rect(100, 80, 20, 20)
  const floating = rect(0, 0, 40, 30)

  it.each([
    ["bottom", 90, 104],
    ["top", 90, 46],
    ["right", 124, 75],
    ["left", 56, 75],
  ])("places %s with a side offset", (side, x, y) => {
    const result = computeFloatingPosition(anchor, floating, config({ side, sideOffset: 4 }))

    expect(result).toMatchObject({ align: "center", side, x, y })
  })

  it.each([
    ["top", "start", "ltr", "0% calc(100% + 4px)"],
    ["bottom", "end", "ltr", "100% -4px"],
    ["left", "start", "ltr", "calc(100% + 4px) 0%"],
    ["right", "end", "ltr", "-4px 100%"],
    ["bottom", "start", "rtl", "100% -4px"],
    ["bottom", "center", "ltr", "20px -4px"],
  ])("uses the upstream arrowless origin for %s/%s in %s", (side, align, direction, expected) => {
    const result = computeFloatingPosition(anchor, floating, config({ align, direction, side, sideOffset: 4 }))

    expect(result.transformOrigin).toBe(expected)
  })

  it("uses the anchor center as origin after cross-axis collision shifting", () => {
    const oversized = rect(0, 0, 400, 20)
    const result = computeFloatingPosition(anchor, oversized, config({ align: "start", side: "bottom" }))

    expect(result).toMatchObject({ align: "start", x: 5 })
    expect(result.transformOrigin).toBe("105px 0px")
  })

  it.each([
    ["top", rect(100, 2, 20, 20), "bottom"],
    ["bottom", rect(100, 180, 20, 20), "top"],
    ["left", rect(2, 80, 20, 20), "right"],
    ["right", rect(280, 80, 20, 20), "left"],
  ])("flips %s at its viewport edge", (side, edgeAnchor, expected) => {
    const result = computeFloatingPosition(edgeAnchor, floating, config({ side, sideOffset: 4 }))

    expect(result.side).toBe(expected)
    expect(result.x).toBeGreaterThanOrEqual(5)
    expect(result.y).toBeGreaterThanOrEqual(5)
    expect(result.x + floating.width).toBeLessThanOrEqual(295)
    expect(result.y + floating.height).toBeLessThanOrEqual(195)
  })

  it("uses logical start/end alignment and offset in LTR and RTL", () => {
    const wideAnchor = rect(100, 80, 40, 20)
    const narrowFloating = rect(0, 0, 20, 20)

    expect(computeFloatingPosition(wideAnchor, narrowFloating, config({ align: "start" })).x).toBe(100)
    expect(computeFloatingPosition(wideAnchor, narrowFloating, config({ align: "end" })).x).toBe(120)
    expect(computeFloatingPosition(wideAnchor, narrowFloating, config({ align: "start", direction: "rtl" })).x).toBe(120)
    expect(computeFloatingPosition(wideAnchor, narrowFloating, config({ align: "end", direction: "rtl" })).x).toBe(100)
    expect(computeFloatingPosition(wideAnchor, narrowFloating, config({ align: "start", alignOffset: 4 })).x).toBe(104)
    expect(computeFloatingPosition(wideAnchor, narrowFloating, config({ align: "start", alignOffset: 4, direction: "rtl" })).x).toBe(116)
  })

  it("resolves inline sides from direction without changing physical sides", () => {
    const narrowFloating = rect(0, 0, 20, 20)

    expect(computeFloatingPosition(anchor, narrowFloating, config({ side: "inline-start", sideOffset: 4 })).x).toBe(76)
    expect(computeFloatingPosition(anchor, narrowFloating, config({ side: "inline-start", sideOffset: 4 })).side).toBe("inline-start")
    expect(computeFloatingPosition(anchor, narrowFloating, config({ direction: "rtl", side: "inline-start", sideOffset: 4 })).x).toBe(124)
    expect(computeFloatingPosition(anchor, narrowFloating, config({ direction: "rtl", side: "left", sideOffset: 4 })).x).toBe(76)
  })

  it("flips alignment before shifting and honors custom collision padding", () => {
    const edgeAnchor = rect(280, 80, 10, 20)
    const wideFloating = rect(0, 0, 60, 20)
    const result = computeFloatingPosition(edgeAnchor, wideFloating, config({
      align: "start",
      collisionPadding: 7,
    }))

    expect(result.align).toBe("end")
    expect(result.x).toBe(230)
    expect(result.availableWidth).toBe(286)
  })

  it("uses the logical end perpendicular side when neither main-axis side fits", () => {
    const centeredAnchor = rect(140, 90, 20, 20)
    const tallFloating = rect(0, 0, 50, 150)

    const ltr = computeFloatingPosition(centeredAnchor, tallFloating, config({ side: "bottom", sideOffset: 4 }))
    const rtl = computeFloatingPosition(centeredAnchor, tallFloating, config({
      direction: "rtl",
      side: "bottom",
      sideOffset: 4,
    }))

    expect(ltr).toMatchObject({ side: "right", x: 164, y: 25 })
    expect(rtl).toMatchObject({ side: "left", x: 86, y: 25 })
  })

  it("selects align per placement when falling back to a perpendicular axis", () => {
    const edgeAnchor = rect(2, 80, 10, 40)
    const tallFloating = rect(0, 0, 20, 140)
    const result = computeFloatingPosition(edgeAnchor, tallFloating, config({
      align: "start",
      side: "top",
      sideOffset: 4,
    }))

    expect(result).toMatchObject({ align: "end", side: "right", x: 16, y: 5 })
  })

  it("shifts center alignment before flip candidate scoring", () => {
    const edgeAnchor = rect(140, 20, 10, 40)
    const largeFloating = rect(0, 0, 140, 140)
    const result = computeFloatingPosition(edgeAnchor, largeFloating, config({
      align: "center",
      side: "right",
      sideOffset: 12,
    }))

    expect(result).toMatchObject({ align: "center", side: "right", x: 162, y: 5 })
  })

  it("keeps the best-fit side coordinate when no placement fully fits", () => {
    const centeredAnchor = rect(140, 90, 20, 20)
    const oversized = rect(0, 0, 300, 300)
    const result = computeFloatingPosition(centeredAnchor, oversized, config({ side: "bottom" }))

    expect(result).toMatchObject({ side: "bottom", x: 5, y: 110 })
  })
})

it("keeps all floating controller geometry in the shared positioning module", async () => {
  for (const name of ["popover", "tooltip", "hover_card", "menu"]) {
    const source = await readFile(path.join(controllerRoot, `${name}_controller.js`), "utf8")

    expect(source).toContain("@supermomonga/shadcn-view-components/floating_position")
    expect(source).not.toContain("getBoundingClientRect")
    expect(source).not.toContain("offsetWidth")
    expect(source).not.toContain("offsetHeight")
  }
})

describe("startFloatingPosition", () => {
  beforeEach(() => {
    Object.defineProperty(window, "innerWidth", { configurable: true, value: 300 })
    Object.defineProperty(window, "innerHeight", { configurable: true, value: 200 })
  })

  it("applies resolved attributes and follows scroll, resize, element resize, and layout shift", () => {
    vi.useFakeTimers()
    const scrollBaseline = listenerCount(document, "scroll")
    const scroller = document.createElement("div")
    const anchor = document.createElement("button")
    const floating = document.createElement("div")
    const anchorRect = { height: 20, width: 40, x: 100, y: 80 }
    const floatingRect = { height: 30, width: 60, x: 0, y: 0 }
    floating.dataset.positionSide = "bottom"
    floating.dataset.positionAlign = "start"
    floating.dataset.positionSideOffset = "4"
    floating.dataset.positionAlignOffset = "2"
    floating.dataset.positionCollisionPadding = "7"
    metrics(anchor, anchorRect)
    metrics(floating, floatingRect)
    scroller.append(anchor)
    document.body.append(scroller, floating)

    const handle = startFloatingPosition({ anchor, floating, side: "top" })

    expect(floating.style.left).toBe("102px")
    expect(floating.style.top).toBe("104px")
    expect(floating.dataset.side).toBe("bottom")
    expect(floating.dataset.align).toBe("start")
    expect(floating.style.getPropertyValue("--anchor-width")).toBe("40px")
    expect(floating.style.getPropertyValue("--available-height")).toBe("89px")
    expect(floating.style.getPropertyValue("--transform-origin")).toBe("0% -4px")
    expect(listenerCount(document, "scroll")).toBe(scrollBaseline + 1)
    expect(resizeObserverCount(anchor)).toBe(1)
    expect(resizeObserverCount(floating)).toBe(1)
    expect(intersectionObserverCount(anchor)).toBe(1)

    anchorRect.x = 120
    scroller.dispatchEvent(new Event("scroll"))
    window.dispatchEvent(new Event("resize"))
    notifyResize(anchor)
    expect(vi.getTimerCount()).toBe(1)
    vi.advanceTimersByTime(17)
    expect(floating.style.left).toBe("122px")

    anchorRect.x = 130
    notifyResize(floating)
    vi.advanceTimersByTime(17)
    expect(floating.style.left).toBe("132px")

    anchorRect.x = 140
    notifyAnchorMove(anchor)
    vi.advanceTimersByTime(17)
    expect(floating.style.left).toBe("142px")

    handle.destroy()
    handle.destroy()
    expect(listenerCount(document, "scroll")).toBe(scrollBaseline)
    expect(resizeObserverCount()).toBe(0)
    expect(intersectionObserverCount()).toBe(0)
    expect(vi.getTimerCount()).toBe(0)

    anchorRect.x = 160
    scroller.dispatchEvent(new Event("scroll"))
    window.dispatchEvent(new Event("resize"))
    notifyResize(anchor)
    vi.runAllTimers()
    expect(floating.style.left).toBe("142px")
  })

  it("keeps instances independent and cancels a queued update on destroy", () => {
    vi.useFakeTimers()
    const firstAnchor = document.createElement("button")
    const secondAnchor = document.createElement("button")
    const firstFloating = document.createElement("div")
    const secondFloating = document.createElement("div")
    const firstRect = { height: 20, width: 20, x: 40, y: 40 }
    const secondRect = { height: 20, width: 20, x: 180, y: 80 }
    metrics(firstAnchor, firstRect)
    metrics(secondAnchor, secondRect)
    metrics(firstFloating, { height: 20, width: 40, x: 0, y: 0 })
    metrics(secondFloating, { height: 20, width: 40, x: 0, y: 0 })
    document.body.append(firstAnchor, firstFloating, secondAnchor, secondFloating)

    const first = startFloatingPosition({ anchor: firstAnchor, floating: firstFloating })
    const second = startFloatingPosition({ anchor: secondAnchor, floating: secondFloating })
    expect(resizeObserverCount()).toBe(2)

    firstRect.x = 80
    secondRect.x = 200
    notifyResize(firstAnchor)
    notifyResize(secondAnchor)
    first.destroy()
    vi.advanceTimersByTime(17)

    expect(firstFloating.style.left).toBe("30px")
    expect(secondFloating.style.left).toBe("190px")
    expect(resizeObserverCount()).toBe(1)
    second.destroy()
    expect(resizeObserverCount()).toBe(0)
  })

  it("keeps preferred data separate from a flipped output across restarts", () => {
    const anchor = document.createElement("button")
    const floating = document.createElement("div")
    const anchorRect = { height: 20, width: 20, x: 100, y: 180 }
    floating.dataset.positionSide = "bottom"
    metrics(anchor, anchorRect)
    metrics(floating, { height: 30, width: 40, x: 0, y: 0 })
    document.body.append(anchor, floating)

    const first = startFloatingPosition({ anchor, floating })
    expect(floating.dataset.positionSide).toBe("bottom")
    expect(floating.dataset.side).toBe("top")
    first.destroy()

    anchorRect.y = 80
    const second = startFloatingPosition({ anchor, floating })
    expect(floating.dataset.positionSide).toBe("bottom")
    expect(floating.dataset.side).toBe("bottom")
    second.destroy()
  })

  it("positions from layout size while an opening transform changes the rendered box", () => {
    const anchor = document.createElement("button")
    const floating = document.createElement("div")
    metrics(anchor, { height: 20, width: 40, x: 100, y: 80 })
    metrics(floating, { height: 15, width: 30, x: 0, y: 0 })
    Object.defineProperties(floating, {
      offsetHeight: { configurable: true, value: 30 },
      offsetWidth: { configurable: true, value: 60 },
    })
    document.body.append(anchor, floating)

    const handle = startFloatingPosition({ anchor, floating, sideOffset: 4 })

    expect(floating.style.left).toBe("90px")
    expect(floating.style.top).toBe("104px")
    handle.destroy()
  })

  it("uses the local direction and supports a point anchor", () => {
    const rtlRoot = document.createElement("div")
    rtlRoot.dir = "rtl"
    const anchor = document.createElement("button")
    const floating = document.createElement("div")
    rtlRoot.append(anchor)
    document.body.append(rtlRoot, floating)
    metrics(anchor, { height: 20, width: 40, x: 100, y: 80 })
    metrics(floating, { height: 20, width: 20, x: 0, y: 0 })

    const rtl = startFloatingPosition({ align: "start", anchor, floating })
    expect(floating.style.left).toBe("120px")
    rtl.destroy()

    const point = startFloatingPosition({
      align: "start",
      alignOffset: 4,
      anchor: pointAnchor(250, 100, anchor),
      floating,
      side: "right",
    })
    expect(floating.style.left).toBe("250px")
    expect(floating.style.top).toBe("104px")
    point.destroy()
  })

  it("fails fast for invalid positioning data", () => {
    const anchor = document.createElement("button")
    const floating = document.createElement("div")
    floating.dataset.positionSide = "diagonal"

    expect(() => startFloatingPosition({ anchor, floating })).toThrow(/invalid floating side/)
  })
})
