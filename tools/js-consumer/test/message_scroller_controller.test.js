import { describe, expect, it, vi } from "vitest"

import { listenerCount } from "./support/listener_ledger.js"
import { mount } from "./support/stimulus.js"

function scrollerRoot(id) {
  return `
    <div id="${id}" data-controller="shadcn--message-scroller">
      <div id="${id}-viewport" data-slot="message-scroller-viewport"></div>
      <button id="${id}-button" data-slot="message-scroller-button"
              data-action="shadcn--message-scroller#scrollToBottom">Bottom</button>
    </div>
  `
}

function setScrollMetrics(element, { clientHeight, scrollHeight, scrollTop }) {
  Object.defineProperties(element, {
    clientHeight: { configurable: true, value: clientHeight },
    scrollHeight: { configurable: true, value: scrollHeight },
    scrollTop: { configurable: true, value: scrollTop, writable: true },
  })
}

describe("shadcn--message-scroller", () => {
  it("keeps scroll state and actions isolated between roots", async () => {
    await mount(`${scrollerRoot("one")}${scrollerRoot("two")}`)
    const firstViewport = document.querySelector("#one-viewport")
    const secondViewport = document.querySelector("#two-viewport")
    const firstScrollTo = vi.fn()
    const secondScrollTo = vi.fn()
    firstViewport.scrollTo = firstScrollTo
    secondViewport.scrollTo = secondScrollTo
    setScrollMetrics(firstViewport, { clientHeight: 100, scrollHeight: 300, scrollTop: 100 })
    setScrollMetrics(secondViewport, { clientHeight: 100, scrollHeight: 300, scrollTop: 190 })

    firstViewport.dispatchEvent(new Event("scroll"))
    secondViewport.dispatchEvent(new Event("scroll"))

    expect(document.querySelector("#one-button").hidden).toBe(false)
    expect(document.querySelector("#two-button").hidden).toBe(true)

    document.querySelector("#one-button").click()
    expect(firstScrollTo).toHaveBeenCalledWith({ behavior: "smooth", top: 300 })
    expect(secondScrollTo).not.toHaveBeenCalled()
  })

  it("removes the viewport listener on disconnect", async () => {
    const lifecycle = await mount(scrollerRoot("cleanup"))
    const root = document.querySelector("#cleanup")
    const viewport = document.querySelector("#cleanup-viewport")
    const button = document.querySelector("#cleanup-button")

    expect(listenerCount(viewport, "scroll")).toBe(1)
    await lifecycle.disconnect(root)
    expect(listenerCount(viewport, "scroll")).toBe(0)

    button.hidden = false
    viewport.dispatchEvent(new Event("scroll"))
    expect(button.hidden).toBe(false)
  })
})
