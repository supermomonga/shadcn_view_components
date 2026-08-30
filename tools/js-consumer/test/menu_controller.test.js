import { describe, expect, it, vi } from "vitest"

import { animationEvent } from "./support/browser.js"
import { listenerCount } from "./support/listener_ledger.js"
import { flushStimulus, mount } from "./support/stimulus.js"

function dropdownFixture(id) {
  return `
    <section id="${id}" data-controller="shadcn--menu">
      <button id="${id}-trigger" type="button" aria-haspopup="menu" aria-expanded="false"
              data-action="shadcn--menu#toggle">Open</button>
      <div id="${id}-content" popover="auto" role="menu" data-state="closed">
        <button id="${id}-first" role="menuitem" data-action="shadcn--menu#activate">First</button>
        <button id="${id}-second" role="menuitem" data-action="shadcn--menu#activate">Second</button>
      </div>
    </section>
  `
}

function contextFixture(id) {
  return `
    <section id="${id}" data-controller="shadcn--menu">
      <div id="${id}-trigger" data-slot="context-menu-trigger">Context area</div>
      <div id="${id}-content" popover="manual" role="menu" data-state="closed">
        <button role="menuitem" data-action="shadcn--menu#activate">Item</button>
      </div>
    </section>
  `
}

function submenuFixture(id) {
  return `
    <section id="${id}" data-controller="shadcn--menu">
      <button id="${id}-trigger" type="button" aria-haspopup="menu" aria-expanded="false"
              data-action="shadcn--menu#toggle">Open</button>
      <div id="${id}-content" popover="auto" role="menu" data-state="closed">
        <div data-slot="dropdown-menu-sub">
          <button id="${id}-sub-trigger" role="menuitem" data-slot="dropdown-menu-sub-trigger"
                  data-action="shadcn--menu#toggleSub">Submenu</button>
          <div id="${id}-sub" popover="auto" role="menu" data-state="closed">
            <button role="menuitem" data-action="shadcn--menu#activate">Nested item</button>
          </div>
        </div>
      </div>
    </section>
  `
}

describe("shadcn--menu", () => {
  it("opens, navigates, activates, and isolates a separate dropdown root", async () => {
    vi.useFakeTimers()
    const harness = await mount(`${dropdownFixture("first")}${dropdownFixture("second-root")}`)
    const firstRoot = document.querySelector("#first")
    const trigger = document.querySelector("#first-trigger")
    const content = document.querySelector("#first-content")
    const firstItem = document.querySelector("#first-first")
    const secondItem = document.querySelector("#first-second")
    const otherRoot = document.querySelector("#second-root")
    const otherContent = document.querySelector("#second-root-content")

    trigger.click()
    expect(content.matches(":popover-open")).toBe(true)
    expect(firstItem.dataset.highlighted).toBe("true")
    expect(document.activeElement).toBe(firstItem)
    expect(otherContent.matches(":popover-open")).toBe(false)

    content.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "ArrowDown" }))
    expect(secondItem.dataset.highlighted).toBe("true")
    expect(document.activeElement).toBe(secondItem)

    vi.clearAllTimers()
    secondItem.click()
    expect(content.dataset.state).toBe("closed")
    expect(trigger.getAttribute("aria-expanded")).toBe("false")
    expect(listenerCount(content, "animationend")).toBe(1)
    expect(vi.getTimerCount()).toBe(1)

    content.dispatchEvent(animationEvent("animationend", "exit"))
    expect(content.matches(":popover-open")).toBe(false)
    expect(listenerCount(content, "animationend")).toBe(0)
    expect(vi.getTimerCount()).toBe(0)
    otherRoot.remove()
    await flushStimulus()
    await harness.disconnect(firstRoot)
  })

  it("opens a context menu at the pointer and cancels outside-click exit on disconnect", async () => {
    vi.useFakeTimers()
    const pointerdownBaseline = listenerCount(document, "pointerdown")
    const harness = await mount(contextFixture("context"))
    const root = document.querySelector("#context")
    const trigger = document.querySelector("#context-trigger")
    const content = document.querySelector("#context-content")

    const event = new MouseEvent("contextmenu", {
      bubbles: true,
      cancelable: true,
      clientX: 24,
      clientY: 32,
    })
    trigger.dispatchEvent(event)
    expect(event.defaultPrevented).toBe(true)
    expect(content.matches(":popover-open")).toBe(true)
    expect(content.dataset.state).toBe("open")
    expect(listenerCount(document, "pointerdown")).toBe(pointerdownBaseline + 1)

    vi.clearAllTimers()
    document.body.dispatchEvent(new Event("pointerdown", { bubbles: true }))
    expect(content.dataset.state).toBe("closed")
    expect(listenerCount(content, "animationend")).toBe(1)
    expect(vi.getTimerCount()).toBe(1)

    root.remove()
    await flushStimulus()
    expect(listenerCount(root, "click")).toBe(0)
    expect(listenerCount(root, "contextmenu")).toBe(0)
    expect(listenerCount(root, "keydown")).toBe(0)
    expect(listenerCount(document, "pointerdown")).toBe(pointerdownBaseline)
    expect(listenerCount(content, "toggle")).toBe(0)
    expect(listenerCount(content, "animationend")).toBe(0)
    expect(listenerCount(content, "animationcancel")).toBe(0)
    expect(vi.getTimerCount()).toBe(0)
    expect(content.matches(":popover-open")).toBe(false)

    document.body.appendChild(root)
    await flushStimulus()
    expect(content.matches(":popover-open")).toBe(false)
    expect(content.dataset.state).toBe("closed")
    await harness.disconnect(root)
  })

  it("opens and reverses exit for a submenu through its action", async () => {
    vi.useFakeTimers()
    const harness = await mount(submenuFixture("nested"))
    const root = document.querySelector("#nested")
    const submenuTrigger = document.querySelector("#nested-sub-trigger")
    const submenu = document.querySelector("#nested-sub")

    document.querySelector("#nested-trigger").click()
    submenuTrigger.click()
    expect(submenu.matches(":popover-open")).toBe(true)
    expect(submenu.dataset.state).toBe("open")

    vi.clearAllTimers()
    submenuTrigger.click()
    expect(submenu.dataset.state).toBe("closed")
    expect(vi.getTimerCount()).toBe(1)
    submenuTrigger.click()
    expect(submenu.matches(":popover-open")).toBe(true)
    expect(submenu.dataset.state).toBe("open")
    expect(listenerCount(submenu, "animationend")).toBe(0)
    expect(vi.getTimerCount()).toBe(0)

    await harness.disconnect(root)
  })
})
