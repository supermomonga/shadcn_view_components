import { describe, expect, it, vi } from "vitest"

import { animationEvent, intersectionObserverCount, resizeObserverCount } from "./support/browser.js"
import { listenerCount } from "./support/listener_ledger.js"
import { flushStimulus, mount } from "./support/stimulus.js"

function popoverFixture(id) {
  return `
    <section id="${id}" data-controller="shadcn--popover">
      <button id="${id}-trigger" type="button" data-slot="popover-trigger"
              aria-expanded="false" data-action="shadcn--popover#toggle">Toggle</button>
      <div id="${id}-content" popover="auto" data-state="closed" data-position-side-offset="6">Content</div>
    </section>
  `
}

describe("shadcn--popover", () => {
  it("opens one root, reverses its pending exit, and leaves another root unchanged", async () => {
    vi.useFakeTimers()
    const harness = await mount(`${popoverFixture("first")}${popoverFixture("second")}`)
    const firstRoot = document.querySelector("#first")
    const trigger = document.querySelector("#first-trigger")
    const content = document.querySelector("#first-content")
    const secondRoot = document.querySelector("#second")
    const secondContent = document.querySelector("#second-content")

    trigger.click()
    expect(content.matches(":popover-open")).toBe(true)
    expect(content.dataset.state).toBe("open")
    expect(content.hasAttribute("data-open")).toBe(true)
    expect(trigger.getAttribute("aria-expanded")).toBe("true")
    expect(secondContent.matches(":popover-open")).toBe(false)

    trigger.click()
    expect(content.matches(":popover-open")).toBe(true)
    expect(content.dataset.state).toBe("closed")
    expect(trigger.getAttribute("aria-expanded")).toBe("false")
    expect(listenerCount(content, "animationend")).toBe(1)
    expect(vi.getTimerCount()).toBe(1)

    trigger.click()
    expect(content.matches(":popover-open")).toBe(true)
    expect(content.dataset.state).toBe("open")
    expect(trigger.getAttribute("aria-expanded")).toBe("true")
    expect(listenerCount(content, "animationend")).toBe(0)
    expect(listenerCount(content, "animationcancel")).toBe(0)
    expect(vi.getTimerCount()).toBe(0)

    trigger.click()
    content.dispatchEvent(animationEvent("animationcancel", "exit"))
    expect(content.matches(":popover-open")).toBe(false)
    expect(content.dataset.state).toBe("closed")
    expect(vi.getTimerCount()).toBe(0)

    secondRoot.remove()
    await flushStimulus()
    await harness.disconnect(firstRoot)
  })

  it("releases toggle, action, and pending animation resources on disconnect", async () => {
    vi.useFakeTimers()
    const harness = await mount(popoverFixture("cleanup"))
    const root = document.querySelector("#cleanup")
    const trigger = document.querySelector("#cleanup-trigger")
    const content = document.querySelector("#cleanup-content")
    const scrollBaseline = listenerCount(document, "scroll")

    expect(listenerCount(content, "toggle")).toBe(1)
    expect(listenerCount(trigger, "click")).toBe(1)
    trigger.click()
    expect(listenerCount(document, "scroll")).toBe(scrollBaseline + 1)
    expect(resizeObserverCount()).toBe(1)
    expect(intersectionObserverCount()).toBe(1)
    trigger.click()
    expect(vi.getTimerCount()).toBe(1)

    root.remove()
    await flushStimulus()
    expect(listenerCount(content, "toggle")).toBe(0)
    expect(listenerCount(trigger, "click")).toBe(0)
    expect(listenerCount(content, "animationend")).toBe(0)
    expect(listenerCount(content, "animationcancel")).toBe(0)
    expect(vi.getTimerCount()).toBe(0)
    expect(content.matches(":popover-open")).toBe(false)
    expect(listenerCount(document, "scroll")).toBe(scrollBaseline)
    expect(resizeObserverCount()).toBe(0)
    expect(intersectionObserverCount()).toBe(0)

    document.body.appendChild(root)
    await flushStimulus()
    expect(content.matches(":popover-open")).toBe(false)
    expect(content.dataset.state).toBe("closed")
    expect(trigger.getAttribute("aria-expanded")).toBe("false")
    await harness.disconnect(root)
  })
})
