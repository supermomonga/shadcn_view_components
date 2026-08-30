import { describe, expect, it, vi } from "vitest"

import {
  detectRtlScrollType,
  logicalRtlScrollLeft,
  rawRtlScrollLeft,
} from "@supermomonga/shadcn-view-components/controllers/carousel_controller"

import {
  notifyResize,
  resizeObserverCount,
} from "./support/browser.js"
import { listenerCount } from "./support/listener_ledger.js"
import { mount } from "./support/stimulus.js"

const IDENTIFIER = "shadcn--carousel"

function carouselRoot(
  id,
  {
    direction = "ltr",
    extra = "",
    itemCount = 3,
    orientation = "horizontal",
    previousControls,
    viewportId = `${id}-viewport`,
  } = {},
) {
  const items = Array.from(
    { length: itemCount },
    (_, index) => `<div id="${id}-item-${index + 1}" data-slot="carousel-item">${index + 1}</div>`,
  ).join("")
  const controls = previousControls ? ` aria-controls="${previousControls}"` : ""

  return `
    <div id="${id}" dir="${direction}" data-controller="${IDENTIFIER}"
         data-orientation="${orientation}" data-direction="${direction}"
         data-action="keydown->${IDENTIFIER}#navigate">
      <div${viewportId ? ` id="${viewportId}"` : ""} data-slot="carousel-content">
        <div id="${id}-track">${items}</div>
      </div>
      <button id="${id}-previous" data-slot="carousel-previous"${controls}
              data-action="${IDENTIFIER}#scrollPrevious">Previous</button>
      <button id="${id}-next" data-slot="carousel-next"
              data-action="${IDENTIFIER}#scrollNext">Next</button>
      ${extra}
    </div>
  `
}

function setScrollMetrics(
  element,
  {
    clientHeight = 100,
    clientWidth = 100,
    scrollHeight = clientHeight,
    scrollLeft = 0,
    scrollTop = 0,
    scrollWidth = clientWidth,
  },
) {
  Object.defineProperties(element, {
    clientHeight: { configurable: true, value: clientHeight, writable: true },
    clientWidth: { configurable: true, value: clientWidth, writable: true },
    scrollHeight: { configurable: true, value: scrollHeight, writable: true },
    scrollLeft: { configurable: true, value: scrollLeft, writable: true },
    scrollTop: { configurable: true, value: scrollTop, writable: true },
    scrollWidth: { configurable: true, value: scrollWidth, writable: true },
  })
}

function rectangle({ height = 60, left = 0, top = 0, width = 60 }) {
  return {
    bottom: top + height,
    height,
    left,
    right: left + width,
    top,
    width,
    x: left,
    y: top,
    toJSON() {
      return this
    },
  }
}

function setItemPositions(items, positions, { direction = "ltr", orientation = "horizontal" } = {}) {
  for (const [index, item] of items.entries()) {
    const position = positions[index]
    item.getBoundingClientRect = vi.fn(() => {
      if (orientation === "vertical") return rectangle({ top: position })
      if (direction === "rtl") return rectangle({ left: 300 - position - 60 })
      return rectangle({ left: position })
    })
  }
}

async function setupCarousel({
  direction = "ltr",
  id = "carousel",
  itemCount = 3,
  metrics = {},
  orientation = "horizontal",
  positions = [0, 80, 200],
  previousControls,
  rtlType = "negative",
  viewportId,
} = {}) {
  const lifecycle = await mount(carouselRoot(id, {
    direction,
    itemCount,
    orientation,
    previousControls,
    viewportId,
  }))
  const root = document.querySelector(`#${id}`)
  const viewport = root.querySelector("[data-slot='carousel-content']")
  const track = viewport.firstElementChild
  const items = [...root.querySelectorAll("[data-slot='carousel-item']")]
  const previous = root.querySelector("[data-slot='carousel-previous']")
  const next = root.querySelector("[data-slot='carousel-next']")
  const controller = lifecycle.controller(root, IDENTIFIER)

  setScrollMetrics(viewport, orientation === "vertical"
    ? { clientHeight: 100, scrollHeight: 300, ...metrics }
    : { clientWidth: 100, scrollWidth: 300, ...metrics })
  setItemPositions(items, positions, { direction, orientation })
  viewport.scrollTo = vi.fn()
  if (direction === "rtl" && orientation === "horizontal") controller.rtlType = rtlType
  notifyResize(viewport)

  return { controller, items, lifecycle, next, previous, root, track, viewport }
}

function keydown(target, key) {
  const event = new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key })
  target.dispatchEvent(event)
  return event
}

describe("RTL scrollLeft conversion", () => {
  it.each([
    ["negative", -40, 40, -40],
    ["positive-ascending", 40, 40, 40],
    ["positive-descending", 60, 40, 60],
  ])("round-trips the %s browser representation", (type, raw, logical, expectedRaw) => {
    expect(logicalRtlScrollLeft(raw, 100, type)).toBe(logical)
    expect(rawRtlScrollLeft(logical, 100, type)).toBe(expectedRaw)
  })

  it.each([
    ["negative", 5, -105],
    ["positive-ascending", -5, 105],
    ["positive-descending", 105, -5],
  ])("clamps %s overscroll at both logical boundaries", (type, beforeStart, pastEnd) => {
    expect(logicalRtlScrollLeft(beforeStart, 100, type)).toBe(0)
    expect(logicalRtlScrollLeft(pastEnd, 100, type)).toBe(100)
    expect(rawRtlScrollLeft(-5, 100, type)).toBe(rawRtlScrollLeft(0, 100, type))
    expect(rawRtlScrollLeft(105, 100, type)).toBe(rawRtlScrollLeft(100, 100, type))
  })

  it("detects the owner document representation without leaving its probe in the DOM", () => {
    const childCount = document.body.childElementCount

    expect(detectRtlScrollType(document)).toBe("positive-ascending")
    expect(document.body.childElementCount).toBe(childCount)
  })
})

describe("shadcn--carousel", () => {
  it("scrolls to actual variable item positions and exposes the controlled viewport", async () => {
    const { next, previous, viewport } = await setupCarousel({
      metrics: { clientWidth: 120, scrollWidth: 420 },
      positions: [0, 72, 205],
    })

    expect(previous.getAttribute("aria-controls")).toBe(viewport.id)
    expect(next.getAttribute("aria-controls")).toBe(viewport.id)
    expect(previous.disabled).toBe(true)
    expect(next.disabled).toBe(false)

    next.click()
    expect(viewport.scrollTo).toHaveBeenLastCalledWith({ behavior: "smooth", left: 72 })

    viewport.scrollLeft = 72
    viewport.dispatchEvent(new Event("scroll"))
    next.click()
    expect(viewport.scrollTo).toHaveBeenLastCalledWith({ behavior: "smooth", left: 205 })
    expect(previous.disabled).toBe(false)
  })

  it("generates missing viewport relationships while preserving supplied aria-controls", async () => {
    const generated = await setupCarousel({ id: "generated", viewportId: "" })
    expect(generated.viewport.id).toBe("generated-viewport")
    expect(generated.previous.getAttribute("aria-controls")).toBe("generated-viewport")
    expect(generated.next.getAttribute("aria-controls")).toBe("generated-viewport")
    await generated.lifecycle.disconnect(generated.root)

    const supplied = await mount(carouselRoot("supplied", { previousControls: "external-viewport" }))
    const root = document.querySelector("#supplied")
    expect(root.querySelector("[data-slot='carousel-previous']").getAttribute("aria-controls"))
      .toBe("external-viewport")
    expect(root.querySelector("[data-slot='carousel-next']").getAttribute("aria-controls"))
      .toBe("supplied-viewport")
    await supplied.disconnect(root)
  })

  it.each([
    {
      direction: "ltr",
      ignoredKey: "ArrowDown",
      nextKey: "ArrowRight",
      orientation: "horizontal",
      previousKey: "ArrowLeft",
      property: "left",
      rawCurrent: 80,
      rawNext: 80,
    },
    {
      direction: "rtl",
      ignoredKey: "ArrowDown",
      nextKey: "ArrowLeft",
      orientation: "horizontal",
      previousKey: "ArrowRight",
      property: "left",
      rawCurrent: -80,
      rawNext: -80,
    },
    {
      direction: "ltr",
      ignoredKey: "ArrowRight",
      nextKey: "ArrowDown",
      orientation: "vertical",
      previousKey: "ArrowUp",
      property: "top",
      rawCurrent: 80,
      rawNext: 80,
    },
    {
      direction: "rtl",
      ignoredKey: "ArrowLeft",
      nextKey: "ArrowDown",
      orientation: "vertical",
      previousKey: "ArrowUp",
      property: "top",
      rawCurrent: 80,
      rawNext: 80,
    },
  ])(
    "maps keyboard and scrollTo for $orientation/$direction",
    async ({ direction, ignoredKey, nextKey, orientation, previousKey, property, rawCurrent, rawNext }) => {
      const { root, viewport } = await setupCarousel({ direction, orientation })

      const ignored = keydown(root, ignoredKey)
      expect(ignored.defaultPrevented).toBe(false)
      expect(viewport.scrollTo).not.toHaveBeenCalled()

      const forward = keydown(root, nextKey)
      expect(forward.defaultPrevented).toBe(true)
      expect(viewport.scrollTo).toHaveBeenLastCalledWith({ behavior: "smooth", [property]: rawNext })

      if (orientation === "vertical") viewport.scrollTop = rawCurrent
      else viewport.scrollLeft = rawCurrent
      viewport.dispatchEvent(new Event("scroll"))
      viewport.scrollTo.mockClear()

      const backward = keydown(root, previousKey)
      expect(backward.defaultPrevented).toBe(true)
      expect(viewport.scrollTo).toHaveBeenCalledWith({ behavior: "smooth", [property]: 0 })
    },
  )

  it("does not consume directional keys from form fields or editable descendants", async () => {
    const { root, viewport } = await setupCarousel()
    const input = document.createElement("input")
    const editable = document.createElement("div")
    editable.setAttribute("contenteditable", "")
    root.append(input, editable)

    for (const element of [input, editable]) {
      const event = keydown(element, "ArrowRight")
      expect(event.defaultPrevented).toBe(false)
    }

    expect(viewport.scrollTo).not.toHaveBeenCalled()
  })

  it("remeasures item snaps and boundary state from ResizeObserver notifications", async () => {
    const { items, next, track, viewport } = await setupCarousel({
      metrics: { clientWidth: 100, scrollWidth: 300 },
      positions: [0, 90, 180],
    })

    expect(resizeObserverCount(viewport)).toBe(1)
    expect(resizeObserverCount(track)).toBe(1)
    for (const item of items) expect(resizeObserverCount(item)).toBe(1)

    viewport.scrollLeft = 200
    viewport.dispatchEvent(new Event("scroll"))
    expect(next.disabled).toBe(true)

    viewport.scrollWidth = 400
    notifyResize(viewport)
    expect(next.disabled).toBe(false)

    setItemPositions(items, [0, 135, 270])
    notifyResize(items[1])

    viewport.scrollLeft = 0
    viewport.dispatchEvent(new Event("scroll"))
    next.click()
    expect(viewport.scrollTo).toHaveBeenLastCalledWith({ behavior: "smooth", left: 135 })
  })

  it("uses the one-pixel tolerance and clamps RTL overscroll at both boundaries", async () => {
    const ltr = await setupCarousel({ id: "ltr-boundary" })
    ltr.viewport.scrollLeft = 0.75
    ltr.viewport.dispatchEvent(new Event("scroll"))
    expect(ltr.previous.disabled).toBe(true)
    ltr.viewport.scrollLeft = 1.01
    ltr.viewport.dispatchEvent(new Event("scroll"))
    expect(ltr.previous.disabled).toBe(false)
    ltr.viewport.scrollLeft = 199.25
    ltr.viewport.dispatchEvent(new Event("scroll"))
    expect(ltr.next.disabled).toBe(true)
    ltr.viewport.scrollLeft = 198.99
    ltr.viewport.dispatchEvent(new Event("scroll"))
    expect(ltr.next.disabled).toBe(false)
    await ltr.lifecycle.disconnect(ltr.root)

    const rtl = await setupCarousel({ direction: "rtl", id: "rtl-boundary" })
    rtl.viewport.scrollLeft = 8
    rtl.viewport.dispatchEvent(new Event("scroll"))
    expect(rtl.previous.disabled).toBe(true)
    expect(rtl.next.disabled).toBe(false)
    rtl.viewport.scrollLeft = -208
    rtl.viewport.dispatchEvent(new Event("scroll"))
    expect(rtl.previous.disabled).toBe(false)
    expect(rtl.next.disabled).toBe(true)
  })

  it.each([
    { end: -200, next: -80, start: 0, type: "negative" },
    { end: 200, next: 80, start: 0, type: "positive-ascending" },
    { end: 0, next: 120, start: 200, type: "positive-descending" },
  ])("uses $type RTL coordinates for controller movement and boundaries", async ({ end, next, start, type }) => {
    const carousel = await setupCarousel({ direction: "rtl", id: `rtl-${type}`, rtlType: type })

    carousel.viewport.scrollLeft = start
    carousel.viewport.dispatchEvent(new Event("scroll"))
    expect(carousel.previous.disabled).toBe(true)
    expect(carousel.next.disabled).toBe(false)

    carousel.next.click()
    expect(carousel.viewport.scrollTo).toHaveBeenLastCalledWith({ behavior: "smooth", left: next })

    carousel.viewport.scrollLeft = end
    carousel.viewport.dispatchEvent(new Event("scroll"))
    expect(carousel.previous.disabled).toBe(false)
    expect(carousel.next.disabled).toBe(true)
  })

  it.each([
    { itemCount: 1, metrics: { clientWidth: 100, scrollWidth: 300 } },
    { itemCount: 3, metrics: { clientWidth: 100, scrollWidth: 100 } },
  ])("disables both controls when there is no adjacent slide", async ({ itemCount, metrics }) => {
    const { next, previous, viewport } = await setupCarousel({ itemCount, metrics })

    expect(previous.disabled).toBe(true)
    expect(next.disabled).toBe(true)
    next.click()
    expect(viewport.scrollTo).not.toHaveBeenCalled()
  })

  it("isolates nested carousels for clicks, keys, items, and relationships", async () => {
    const lifecycle = await mount(carouselRoot("outer", { extra: carouselRoot("inner") }))
    const outerRoot = document.querySelector("#outer")
    const innerRoot = document.querySelector("#inner")
    const outerViewport = document.querySelector("#outer-viewport")
    const innerViewport = document.querySelector("#inner-viewport")
    const outerItems = [...outerRoot.querySelectorAll(":scope > [data-slot='carousel-content'] [data-slot='carousel-item']")]
    const innerItems = [...innerRoot.querySelectorAll("[data-slot='carousel-item']")]
    const outerController = lifecycle.controller(outerRoot, IDENTIFIER)
    const innerController = lifecycle.controller(innerRoot, IDENTIFIER)

    setScrollMetrics(outerViewport, { clientWidth: 100, scrollWidth: 300 })
    setScrollMetrics(innerViewport, { clientWidth: 80, scrollWidth: 240 })
    setItemPositions(outerItems, [0, 90, 180])
    setItemPositions(innerItems, [0, 60, 140])
    outerViewport.scrollTo = vi.fn()
    innerViewport.scrollTo = vi.fn()
    notifyResize(outerViewport)
    notifyResize(innerViewport)

    expect(outerController.items).toEqual(outerItems)
    expect(innerController.items).toEqual(innerItems)
    expect(document.querySelector("#inner-next").getAttribute("aria-controls")).toBe("inner-viewport")

    document.querySelector("#inner-next").click()
    expect(innerViewport.scrollTo).toHaveBeenLastCalledWith({ behavior: "smooth", left: 60 })
    expect(outerViewport.scrollTo).not.toHaveBeenCalled()

    innerViewport.scrollTo.mockClear()
    const event = keydown(innerRoot, "ArrowRight")
    expect(event.defaultPrevented).toBe(true)
    expect(innerViewport.scrollTo).toHaveBeenCalledTimes(1)
    expect(outerViewport.scrollTo).not.toHaveBeenCalled()
  })

  it("removes its scroll listener and every layout observation on disconnect", async () => {
    const { controller, items, lifecycle, previous, root, track, viewport } = await setupCarousel({ id: "cleanup" })

    expect(listenerCount(viewport, "scroll")).toBe(1)
    expect(resizeObserverCount(viewport)).toBe(1)
    expect(resizeObserverCount(track)).toBe(1)
    for (const item of items) expect(resizeObserverCount(item)).toBe(1)

    await lifecycle.disconnect(root)

    expect(listenerCount(viewport, "scroll")).toBe(0)
    expect(resizeObserverCount(viewport)).toBe(0)
    expect(resizeObserverCount(track)).toBe(0)
    for (const item of items) expect(resizeObserverCount(item)).toBe(0)
    expect(controller.viewport).toBeNull()
    expect(controller.resizeObserver).toBeNull()
    expect(controller.snapPositions).toEqual([])

    previous.disabled = false
    viewport.scrollLeft = 0
    viewport.dispatchEvent(new Event("scroll"))
    notifyResize(viewport)
    expect(previous.disabled).toBe(false)
  })

  it("guards click and keyboard actions when no viewport exists", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {})
    await mount(`
      <div id="empty" data-controller="${IDENTIFIER}" data-orientation="horizontal" dir="ltr"
           data-action="keydown->${IDENTIFIER}#navigate">
        <button data-slot="carousel-previous" data-action="${IDENTIFIER}#scrollPrevious">Previous</button>
        <button data-slot="carousel-next" data-action="${IDENTIFIER}#scrollNext">Next</button>
      </div>
    `)
    const root = document.querySelector("#empty")

    root.querySelectorAll("button").forEach((button) => button.click())
    keydown(root, "ArrowRight")
    expect(error).not.toHaveBeenCalled()
    expect([...root.querySelectorAll("button")].every((button) => button.disabled)).toBe(true)
  })
})
