import { describe, expect, it } from "vitest"

import { listenerCount } from "./support/listener_ledger.js"
import { mount } from "./support/stimulus.js"

function resizableRoot(id) {
  return `
    <div id="${id}" data-controller="shadcn--resizable" data-slot="resizable-panel-group">
      <div id="${id}-before" data-slot="resizable-panel"></div>
      <button id="${id}-handle" data-slot="resizable-handle" role="separator"
              aria-orientation="vertical"
              data-action="mousedown->shadcn--resizable#startDrag keydown->shadcn--resizable#nudge"></button>
      <div id="${id}-after" data-slot="resizable-panel"></div>
    </div>
  `
}

function setRect(element, { height, width }) {
  element.getBoundingClientRect = () => DOMRect.fromRect({ height, width })
}

describe("shadcn--resizable", () => {
  it("attaches document listeners only while dragging and isolates another root", async () => {
    await mount(`${resizableRoot("one")}${resizableRoot("two")}`)
    const firstRoot = document.querySelector("#one")
    const firstBefore = document.querySelector("#one-before")
    const firstAfter = document.querySelector("#one-after")
    const secondBefore = document.querySelector("#two-before")
    const firstHandle = document.querySelector("#one-handle")
    setRect(firstRoot, { height: 100, width: 200 })
    setRect(firstBefore, { height: 100, width: 50 })
    setRect(firstAfter, { height: 100, width: 50 })

    expect(listenerCount(document, "mousemove")).toBe(0)
    expect(listenerCount(document, "mouseup")).toBe(0)

    firstHandle.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, clientX: 10 }))
    expect(listenerCount(document, "mousemove")).toBe(1)
    expect(listenerCount(document, "mouseup")).toBe(1)

    document.dispatchEvent(new MouseEvent("mousemove", { clientX: 50 }))
    expect(firstBefore.style.flexBasis).toBe("70%")
    expect(parseFloat(firstAfter.style.flexBasis)).toBeCloseTo(30)
    expect(firstHandle.getAttribute("aria-controls")).toBe(firstBefore.id)
    expect(firstHandle.getAttribute("aria-valuemin")).toBe("10")
    expect(firstHandle.getAttribute("aria-valuemax")).toBe("90")
    expect(firstHandle.getAttribute("aria-valuenow")).toBe("70")
    expect(secondBefore.style.flexBasis).toBe("")

    document.dispatchEvent(new MouseEvent("mouseup"))
    expect(listenerCount(document, "mousemove")).toBe(0)
    expect(listenerCount(document, "mouseup")).toBe(0)

    firstHandle.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "ArrowRight" }))
    expect(firstBefore.style.flexBasis).toBe("75%")
    expect(firstHandle.getAttribute("aria-valuenow")).toBe("75")
    expect(secondBefore.style.flexBasis).toBe("")

    firstHandle.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Home" }))
    expect(firstBefore.style.flexBasis).toBe("10%")
    expect(firstHandle.getAttribute("aria-valuenow")).toBe("10")

    firstHandle.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "End" }))
    expect(firstBefore.style.flexBasis).toBe("90%")
    expect(firstHandle.getAttribute("aria-valuenow")).toBe("90")
    firstHandle.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "ArrowRight" }))
    expect(firstHandle.getAttribute("aria-valuenow")).toBe("90")
  })

  it("discards drag state and listeners when disconnected mid-drag", async () => {
    const lifecycle = await mount(resizableRoot("cleanup"))
    const root = document.querySelector("#cleanup")
    const before = document.querySelector("#cleanup-before")
    const after = document.querySelector("#cleanup-after")
    const handle = document.querySelector("#cleanup-handle")
    const controller = lifecycle.controller(root, "shadcn--resizable")
    setRect(root, { height: 100, width: 200 })
    setRect(before, { height: 100, width: 50 })
    setRect(after, { height: 100, width: 50 })

    handle.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, clientX: 10 }))
    expect(controller.dragging).not.toBeNull()
    expect(listenerCount(document, "mousemove")).toBe(1)

    await lifecycle.disconnect(root)

    expect(controller.dragging).toBeNull()
    expect(listenerCount(document, "mousemove")).toBe(0)
    expect(listenerCount(document, "mouseup")).toBe(0)

    document.dispatchEvent(new MouseEvent("mousemove", { clientX: 90 }))
    expect(before.style.flexBasis).toBe("")
  })

  it("preserves user IDs and ARIA limits while isolating a nested panel group", async () => {
    const lifecycle = await mount(`
      <div id="outer" data-controller="shadcn--resizable" data-slot="resizable-panel-group">
        <div id="user-primary" data-slot="resizable-panel"></div>
        <button id="user-handle" data-slot="resizable-handle" role="separator"
                aria-orientation="vertical" aria-controls="user-primary"
                aria-valuemin="20" aria-valuemax="80" aria-valuenow="30"
                data-action="mousedown->shadcn--resizable#startDrag keydown->shadcn--resizable#nudge"></button>
        <div data-slot="resizable-panel">
          ${resizableRoot("inner")}
        </div>
      </div>
    `)
    const outer = document.querySelector("#outer")
    const outerHandle = document.querySelector("#user-handle")
    const innerHandle = document.querySelector("#inner-handle")

    expect(outerHandle.id).toBe("user-handle")
    expect(outerHandle.getAttribute("aria-controls")).toBe("user-primary")
    expect(outerHandle.getAttribute("aria-valuemin")).toBe("20")
    expect(outerHandle.getAttribute("aria-valuemax")).toBe("80")
    expect(outerHandle.getAttribute("aria-valuenow")).toBe("30")
    expect(innerHandle.getAttribute("aria-controls")).toBe("inner-before")

    outerHandle.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "End" }))
    expect(outerHandle.getAttribute("aria-valuenow")).toBe("80")
    expect(innerHandle.getAttribute("aria-valuenow")).toBe("50")

    await lifecycle.disconnect(outer)
  })
})
