import { describe, expect, it, vi } from "vitest"

import { listenerCount } from "./support/listener_ledger.js"
import { flushStimulus, mount } from "./support/stimulus.js"

function hoverCardFixture(id) {
  return `
    <section id="${id}" data-controller="shadcn--hover-card">
      <button id="${id}-trigger" type="button" data-slot="hover-card-trigger"
              data-action="mouseenter->shadcn--hover-card#show mouseleave->shadcn--hover-card#hide
                           focus->shadcn--hover-card#show blur->shadcn--hover-card#hide">Trigger</button>
      <div id="${id}-content" data-slot="hover-card-content" data-state="closed" hidden
           data-action="mouseenter->shadcn--hover-card#show mouseleave->shadcn--hover-card#hide">Content</div>
    </section>
  `
}

function mouse(element, type) {
  element.dispatchEvent(new MouseEvent(type))
}

describe("shadcn--hover-card", () => {
  it("honors hover intent, reverses exit, and isolates another root", async () => {
    vi.useFakeTimers()
    const harness = await mount(`${hoverCardFixture("first")}${hoverCardFixture("second")}`)
    const firstRoot = document.querySelector("#first")
    const trigger = document.querySelector("#first-trigger")
    const content = document.querySelector("#first-content")
    const secondRoot = document.querySelector("#second")
    const secondContent = document.querySelector("#second-content")

    mouse(trigger, "mouseenter")
    vi.advanceTimersByTime(99)
    expect(content.hidden).toBe(true)
    vi.advanceTimersByTime(1)
    expect(content.hidden).toBe(false)
    expect(content.dataset.state).toBe("open")
    expect(content.hasAttribute("data-open")).toBe(true)
    expect(secondContent.hidden).toBe(true)

    mouse(trigger, "mouseleave")
    vi.advanceTimersByTime(150)
    expect(content.dataset.state).toBe("closed")
    expect(listenerCount(content, "animationend")).toBe(1)

    mouse(trigger, "mouseenter")
    expect(listenerCount(content, "animationend")).toBe(0)
    expect(listenerCount(content, "animationcancel")).toBe(0)
    vi.advanceTimersByTime(100)
    expect(content.hidden).toBe(false)
    expect(content.dataset.state).toBe("open")
    expect(vi.getTimerCount()).toBe(0)

    secondRoot.remove()
    await flushStimulus()
    await harness.disconnect(firstRoot)
  })

  it("cancels show, hide delay, and exit work when disconnected", async () => {
    vi.useFakeTimers()
    const harness = await mount(hoverCardFixture("cleanup"))
    const root = document.querySelector("#cleanup")
    const trigger = document.querySelector("#cleanup-trigger")
    const content = document.querySelector("#cleanup-content")

    mouse(trigger, "mouseenter")
    expect(vi.getTimerCount()).toBe(1)
    await harness.disconnect(root)
    expect(vi.getTimerCount()).toBe(0)
    expect(listenerCount(trigger, "mouseenter")).toBe(0)
    expect(listenerCount(trigger, "mouseleave")).toBe(0)

    const hideHarness = await mount(hoverCardFixture("hide-delay"))
    const hideRoot = document.querySelector("#hide-delay")
    const hideTrigger = document.querySelector("#hide-delay-trigger")
    const hideContent = document.querySelector("#hide-delay-content")
    mouse(hideTrigger, "mouseenter")
    vi.advanceTimersByTime(100)
    mouse(hideTrigger, "mouseleave")
    vi.advanceTimersByTime(10)

    hideRoot.remove()
    await flushStimulus()
    expect(vi.getTimerCount()).toBe(0)
    expect(hideContent.dataset.state).toBe("closed")
    expect(hideContent.hidden).toBe(true)

    document.body.appendChild(hideRoot)
    await flushStimulus()
    expect(hideContent.dataset.state).toBe("closed")
    expect(hideContent.hidden).toBe(true)
    await hideHarness.disconnect(hideRoot)

    const secondHarness = await mount(hoverCardFixture("exit"))
    const secondRoot = document.querySelector("#exit")
    const secondTrigger = document.querySelector("#exit-trigger")
    const secondContent = document.querySelector("#exit-content")
    mouse(secondTrigger, "mouseenter")
    vi.advanceTimersByTime(100)
    mouse(secondTrigger, "mouseleave")
    vi.advanceTimersByTime(150)
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
