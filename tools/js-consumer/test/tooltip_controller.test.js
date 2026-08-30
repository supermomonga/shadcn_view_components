import { describe, expect, it, vi } from "vitest"

import { listenerCount } from "./support/listener_ledger.js"
import { flushStimulus, mount } from "./support/stimulus.js"

function tooltipFixture(id) {
  return `
    <section id="${id}" data-controller="shadcn--tooltip">
      <button id="${id}-trigger" type="button" data-slot="tooltip-trigger"
              data-action="mouseenter->shadcn--tooltip#show mouseleave->shadcn--tooltip#hide
                           focus->shadcn--tooltip#show blur->shadcn--tooltip#hide">Trigger</button>
      <div id="${id}-content" data-slot="tooltip-content" data-state="closed"
           role="tooltip" hidden>Tooltip</div>
    </section>
  `
}

describe("shadcn--tooltip", () => {
  it("shows from focus, reverses exit, and isolates another root", async () => {
    vi.useFakeTimers()
    const harness = await mount(`${tooltipFixture("first")}${tooltipFixture("second")}`)
    const firstRoot = document.querySelector("#first")
    const trigger = document.querySelector("#first-trigger")
    const content = document.querySelector("#first-content")
    const secondRoot = document.querySelector("#second")
    const secondContent = document.querySelector("#second-content")

    expect(trigger.getAttribute("aria-describedby")).toBe("first-content")
    trigger.dispatchEvent(new FocusEvent("focus"))
    vi.runOnlyPendingTimers()
    expect(content.hidden).toBe(false)
    expect(content.dataset.state).toBe("open")
    expect(secondContent.hidden).toBe(true)

    trigger.dispatchEvent(new MouseEvent("mouseleave"))
    expect(content.dataset.state).toBe("closed")
    expect(listenerCount(content, "animationend")).toBe(1)
    expect(vi.getTimerCount()).toBe(1)

    trigger.dispatchEvent(new MouseEvent("mouseenter"))
    expect(listenerCount(content, "animationend")).toBe(0)
    vi.runOnlyPendingTimers()
    expect(content.hidden).toBe(false)
    expect(content.dataset.state).toBe("open")
    expect(vi.getTimerCount()).toBe(0)

    secondRoot.remove()
    await flushStimulus()
    await harness.disconnect(firstRoot)
  })

  it("cancels pending show and exit work when disconnected", async () => {
    vi.useFakeTimers()
    const harness = await mount(tooltipFixture("cleanup"))
    const root = document.querySelector("#cleanup")
    const trigger = document.querySelector("#cleanup-trigger")
    const content = document.querySelector("#cleanup-content")

    trigger.dispatchEvent(new MouseEvent("mouseenter"))
    expect(vi.getTimerCount()).toBe(1)
    await harness.disconnect(root)
    expect(vi.getTimerCount()).toBe(0)
    expect(listenerCount(trigger, "mouseenter")).toBe(0)

    const secondHarness = await mount(tooltipFixture("exit"))
    const secondRoot = document.querySelector("#exit")
    const secondTrigger = document.querySelector("#exit-trigger")
    const secondContent = document.querySelector("#exit-content")
    secondTrigger.dispatchEvent(new MouseEvent("mouseenter"))
    vi.runOnlyPendingTimers()
    secondTrigger.dispatchEvent(new MouseEvent("mouseleave"))
    expect(listenerCount(secondContent, "animationend")).toBe(1)

    secondRoot.remove()
    await flushStimulus()
    expect(listenerCount(secondContent, "animationend")).toBe(0)
    expect(listenerCount(secondContent, "animationcancel")).toBe(0)
    expect(vi.getTimerCount()).toBe(0)
    expect(secondContent.hidden).toBe(true)

    document.body.appendChild(secondRoot)
    await flushStimulus()
    expect(secondContent.dataset.state).toBe("closed")
    expect(secondContent.hidden).toBe(true)
    await secondHarness.disconnect(secondRoot)
  })
})
