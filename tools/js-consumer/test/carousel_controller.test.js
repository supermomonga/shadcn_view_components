import { describe, expect, it, vi } from "vitest"

import { listenerCount } from "./support/listener_ledger.js"
import { mount } from "./support/stimulus.js"

function carouselRoot(id) {
  return `
    <div id="${id}" data-controller="shadcn--carousel">
      <div id="${id}-viewport" data-slot="carousel-content"></div>
      <button id="${id}-previous" data-slot="carousel-previous"
              data-action="shadcn--carousel#scrollPrevious">Previous</button>
      <button id="${id}-next" data-slot="carousel-next"
              data-action="shadcn--carousel#scrollNext">Next</button>
    </div>
  `
}

function setScrollMetrics(element, { clientWidth, scrollLeft, scrollWidth }) {
  Object.defineProperties(element, {
    clientWidth: { configurable: true, value: clientWidth },
    scrollLeft: { configurable: true, value: scrollLeft, writable: true },
    scrollWidth: { configurable: true, value: scrollWidth },
  })
}

describe("shadcn--carousel", () => {
  it("scrolls and refreshes only the instance receiving the action", async () => {
    await mount(`${carouselRoot("one")}${carouselRoot("two")}`)
    const firstViewport = document.querySelector("#one-viewport")
    const secondViewport = document.querySelector("#two-viewport")
    const firstScrollBy = vi.fn()
    const secondScrollBy = vi.fn()
    firstViewport.scrollBy = firstScrollBy
    secondViewport.scrollBy = secondScrollBy
    setScrollMetrics(firstViewport, { clientWidth: 100, scrollLeft: 0, scrollWidth: 300 })
    setScrollMetrics(secondViewport, { clientWidth: 80, scrollLeft: 80, scrollWidth: 160 })

    firstViewport.dispatchEvent(new Event("scroll"))
    secondViewport.dispatchEvent(new Event("scroll"))

    expect(document.querySelector("#one-previous").disabled).toBe(true)
    expect(document.querySelector("#one-next").disabled).toBe(false)
    expect(document.querySelector("#two-previous").disabled).toBe(false)
    expect(document.querySelector("#two-next").disabled).toBe(true)

    document.querySelector("#one-next").click()
    expect(firstScrollBy).toHaveBeenCalledWith({ behavior: "smooth", left: 100 })
    expect(secondScrollBy).not.toHaveBeenCalled()

    document.querySelector("#two-previous").click()
    expect(secondScrollBy).toHaveBeenCalledWith({ behavior: "smooth", left: -80 })
  })

  it("guards actions without a viewport and removes its scroll listener", async () => {
    const lifecycle = await mount(`
      ${carouselRoot("cleanup")}
      <div id="empty" data-controller="shadcn--carousel">
        <button data-action="shadcn--carousel#scrollPrevious">Previous</button>
        <button data-action="shadcn--carousel#scrollNext">Next</button>
      </div>
    `)
    const root = document.querySelector("#cleanup")
    const viewport = document.querySelector("#cleanup-viewport")
    const previous = document.querySelector("#cleanup-previous")
    const error = vi.spyOn(console, "error").mockImplementation(() => {})

    expect(listenerCount(viewport, "scroll")).toBe(1)
    document.querySelectorAll("#empty button").forEach((button) => button.click())
    expect(error).not.toHaveBeenCalled()

    await lifecycle.disconnect(root)
    expect(listenerCount(viewport, "scroll")).toBe(0)

    previous.disabled = false
    viewport.scrollLeft = 0
    viewport.dispatchEvent(new Event("scroll"))
    expect(previous.disabled).toBe(false)
  })
})
