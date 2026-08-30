import { describe, expect, it, vi } from "vitest"

import { listenerCount } from "./support/listener_ledger.js"
import { flushStimulus, mount } from "./support/stimulus.js"

function accordionRoot(id, name) {
  return `
    <div id="${id}" data-slot="accordion" data-controller="shadcn--accordion">
      <details id="${id}-first" data-slot="accordion-item" data-controller="shadcn--accordion" name="${name}">
        <summary id="${id}-first-trigger" data-slot="accordion-trigger">First</summary>
        <div id="${id}-first-content" data-slot="accordion-content">First content</div>
      </details>
      <details id="${id}-second" data-slot="accordion-item" data-controller="shadcn--accordion" name="${name}">
        <summary id="${id}-second-trigger" data-slot="accordion-trigger">Second</summary>
        <div id="${id}-second-content" data-slot="accordion-content">Second content</div>
      </details>
    </div>
  `
}

describe("shadcn--accordion", () => {
  it("delegates click and toggle from dynamic items without crossing another root", async () => {
    const lifecycle = await mount(`${accordionRoot("one", "one-group")}${accordionRoot("two", "two-group")}`)
    const firstRoot = document.querySelector("#one")
    const secondRoot = document.querySelector("#two")
    const firstItem = document.querySelector("#one-first")
    const secondRootItem = document.querySelector("#two-first")

    expect(firstRoot).not.toBeNull()
    expect(secondRoot).not.toBeNull()
    expect(firstItem).not.toBeNull()
    expect(secondRootItem).not.toBeNull()
    expect(listenerCount(firstRoot, "click")).toBe(1)
    expect(listenerCount(firstRoot, "toggle")).toBe(1)

    document.querySelector("#one-first-trigger").click()
    expect(firstItem.open).toBe(true)
    expect(firstItem.hasAttribute("data-open")).toBe(true)
    expect(document.querySelector("#one-first-trigger").getAttribute("aria-expanded")).toBe("true")
    expect(document.querySelector("#one-first-trigger").getAttribute("aria-controls")).toBe("one-first-content")
    expect(document.querySelector("#one-first-content").getAttribute("aria-labelledby")).toBe("one-first-trigger")
    expect(document.querySelector("#one-first-content").getAttribute("role")).toBe("region")
    expect(secondRootItem.open).toBe(false)
    expect(secondRootItem.hasAttribute("data-closed")).toBe(true)

    const dynamic = document.createElement("details")
    dynamic.id = "one-dynamic"
    dynamic.dataset.slot = "accordion-item"
    dynamic.innerHTML = `
      <summary data-slot="accordion-trigger">Dynamic</summary>
      <div data-slot="accordion-content">Dynamic content</div>
    `
    firstRoot.appendChild(dynamic)
    dynamic.querySelector("summary").click()

    expect(dynamic.open).toBe(true)
    expect(dynamic.hasAttribute("data-open")).toBe(true)
    expect(dynamic.querySelector("summary").getAttribute("aria-controls")).toBe(dynamic.querySelector("[data-slot='accordion-content']").id)

    dynamic.open = false
    dynamic.dispatchEvent(new Event("toggle"))
    expect(dynamic.hasAttribute("data-closed")).toBe(true)
    expect(dynamic.querySelector("summary").getAttribute("aria-expanded")).toBe("false")

    await lifecycle.disconnect(firstRoot)
    expect(listenerCount(firstRoot, "click")).toBe(0)
    expect(listenerCount(firstRoot, "toggle")).toBe(0)
  })

  it("finishes a close through the fallback and releases animation resources", async () => {
    const lifecycle = await mount(accordionRoot("fallback", "fallback-group"))
    const root = document.querySelector("#fallback")
    const item = document.querySelector("#fallback-first")
    const trigger = document.querySelector("#fallback-first-trigger")
    const content = document.querySelector("#fallback-first-content")
    trigger.click()

    vi.useFakeTimers()
    trigger.click()

    expect(item.open).toBe(true)
    expect(item.hasAttribute("data-closed")).toBe(true)
    expect(listenerCount(content, "animationend")).toBe(1)
    expect(listenerCount(content, "animationcancel")).toBe(1)
    expect(vi.getTimerCount()).toBe(1)

    vi.advanceTimersByTime(300)

    expect(item.open).toBe(false)
    expect(listenerCount(content, "animationend")).toBe(0)
    expect(listenerCount(content, "animationcancel")).toBe(0)
    expect(vi.getTimerCount()).toBe(0)
    await lifecycle.disconnect(root)
  })

  it("cancels a pending close and finalizes state when disconnected", async () => {
    const lifecycle = await mount(accordionRoot("disconnect", "disconnect-group"))
    const root = document.querySelector("#disconnect")
    const item = document.querySelector("#disconnect-first")
    const trigger = document.querySelector("#disconnect-first-trigger")
    const content = document.querySelector("#disconnect-first-content")
    trigger.click()

    vi.useFakeTimers()
    trigger.click()
    expect(vi.getTimerCount()).toBe(1)

    await lifecycle.disconnect(root)
    await flushStimulus()

    expect(item.open).toBe(false)
    expect(item.hasAttribute("data-closed")).toBe(true)
    expect(listenerCount(content, "animationend")).toBe(0)
    expect(listenerCount(content, "animationcancel")).toBe(0)
    expect(vi.getTimerCount()).toBe(0)
  })

  it("manages a standalone Item and preserves consumer references", async () => {
    const html = `
      <details id="standalone" data-slot="accordion-item" data-controller="shadcn--accordion">
        <summary id="consumer-trigger" data-slot="accordion-trigger" aria-controls="consumer-content">Standalone</summary>
        <div id="standalone-content" data-slot="accordion-content" aria-labelledby="consumer-label">Content</div>
      </details>
    `
    const lifecycle = await mount(html)
    const item = document.querySelector("#standalone")
    const trigger = document.querySelector("#consumer-trigger")
    const content = document.querySelector("#standalone-content")

    expect(listenerCount(item, "click")).toBe(1)
    expect(trigger.getAttribute("aria-controls")).toBe("consumer-content")
    expect(content.getAttribute("aria-labelledby")).toBe("consumer-label")
    trigger.click()
    expect(item.open).toBe(true)
    expect(trigger.getAttribute("aria-expanded")).toBe("true")
    await lifecycle.disconnect(item)
  })

  it("does not let an outer root manage nested accordion items", async () => {
    const nested = accordionRoot("outer", "outer-group").replace(
      "First content</div>",
      `First content${accordionRoot("inner", "inner-group")}</div>`,
    )
    const lifecycle = await mount(nested)
    const outerRoot = document.querySelector("#outer")
    const outerFirst = document.querySelector("#outer-first")
    const innerFirst = document.querySelector("#inner-first")

    document.querySelector("#inner-first-trigger").click()
    expect(innerFirst.open).toBe(true)
    expect(outerFirst.open).toBe(false)
    expect(document.querySelector("#inner-first-trigger").getAttribute("aria-controls")).toBe("inner-first-content")

    document.querySelector("#outer-first-trigger").click()
    expect(outerFirst.open).toBe(true)
    expect(innerFirst.open).toBe(true)
    await lifecycle.disconnect(outerRoot)
  })
})
