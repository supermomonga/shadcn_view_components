import { describe, expect, it, vi } from "vitest"

import {
  animationEvent,
  flushToggleEvents,
  intersectionObserverCount,
  resizeObserverCount,
  setToggleEventsDeferred,
} from "./support/browser.js"
import { listenerCount } from "./support/listener_ledger.js"
import { flushStimulus, mount } from "./support/stimulus.js"

function dropdownFixture(id) {
  return `
    <section id="${id}" data-controller="shadcn--menu">
      <button id="${id}-trigger" type="button" aria-haspopup="menu" aria-expanded="false"
              data-action="shadcn--menu#toggle">Open</button>
      <div id="${id}-content" popover="auto" role="menu" data-state="closed">
        <div id="${id}-first" role="menuitem" data-action="shadcn--menu#activate">First</div>
        <div id="${id}-second" role="menuitem" data-action="shadcn--menu#activate">Second</div>
      </div>
    </section>
  `
}

function contextFixture(id) {
  return `
    <section id="${id}" data-controller="shadcn--menu">
      <div id="${id}-trigger" data-slot="context-menu-trigger" tabindex="0" aria-haspopup="menu"
           data-action="contextmenu->shadcn--menu#showAt">Context area</div>
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
          <div id="${id}-sub-trigger" role="menuitem" data-slot="dropdown-menu-sub-trigger"
               data-action="click->shadcn--menu#toggleSub">Submenu</div>
          <div id="${id}-sub" popover="auto" role="menu" data-state="closed">
            <button role="menuitem" data-action="shadcn--menu#activate">Nested item</button>
          </div>
        </div>
      </div>
    </section>
  `
}

function nestedControllerFixture(id) {
  return `
    <section id="${id}" data-controller="shadcn--menu">
      <button id="${id}-trigger" aria-haspopup="menu" aria-expanded="false"
              data-action="shadcn--menu#toggle">Outer</button>
      <div id="${id}-content" popover="auto" role="menu" data-state="closed">
        <button id="${id}-outer-item" role="menuitem" data-action="shadcn--menu#activate">Outer item</button>
        <section id="${id}-inner" data-controller="shadcn--menu">
          <button id="${id}-inner-trigger" aria-haspopup="menu" aria-expanded="false"
                  data-action="shadcn--menu#toggle">Inner</button>
          <div id="${id}-inner-content" popover="auto" role="menu" data-state="closed">
            <button id="${id}-inner-item" role="menuitem"
                    data-action="shadcn--menu#activate">Inner item</button>
          </div>
        </section>
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

    trigger.click()
    expect(content.dataset.state).toBe("closed")
    trigger.click()
    expect(content.dataset.state).toBe("open")

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

  it("keeps a requested close when the native open toggle event arrives later", async () => {
    vi.useFakeTimers()
    setToggleEventsDeferred(true)
    const harness = await mount(dropdownFixture("queued"))
    const root = document.querySelector("#queued")
    const trigger = document.querySelector("#queued-trigger")
    const content = document.querySelector("#queued-content")

    trigger.click()
    trigger.click()
    expect(content.matches(":popover-open")).toBe(true)
    expect(content.dataset.state).toBe("closed")
    expect(trigger.getAttribute("aria-expanded")).toBe("false")
    expect(listenerCount(content, "animationend")).toBe(1)

    flushToggleEvents()
    expect(content.dataset.state).toBe("closed")
    expect(trigger.getAttribute("aria-expanded")).toBe("false")
    expect(listenerCount(content, "animationend")).toBe(1)

    content.dispatchEvent(animationEvent("animationend", "exit"))
    flushToggleEvents()
    expect(content.matches(":popover-open")).toBe(false)
    expect(content.dataset.state).toBe("closed")
    expect(listenerCount(content, "animationend")).toBe(0)
    await harness.disconnect(root)
  })

  it("does not reopen an auto popover after light dismiss on its open trigger", async () => {
    vi.useFakeTimers()
    const harness = await mount(dropdownFixture("light-dismiss"))
    const root = document.querySelector("#light-dismiss")
    const trigger = document.querySelector("#light-dismiss-trigger")
    const content = document.querySelector("#light-dismiss-content")

    trigger.click()
    trigger.dispatchEvent(new MouseEvent("pointerdown", { bubbles: true, button: 0 }))
    content.hidePopover()
    trigger.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, detail: 1 }))

    expect(content.matches(":popover-open")).toBe(false)
    expect(content.dataset.state).toBe("closed")
    expect(trigger.getAttribute("aria-expanded")).toBe("false")
    await harness.disconnect(root)
  })

  it("closes another root when a menu is opened without a pointer event", async () => {
    vi.useFakeTimers()
    const harness = await mount(`${dropdownFixture("first-open")}${dropdownFixture("next-open")}`)
    const firstRoot = document.querySelector("#first-open")
    const nextRoot = document.querySelector("#next-open")
    const firstContent = document.querySelector("#first-open-content")
    const nextContent = document.querySelector("#next-open-content")

    document.querySelector("#first-open-trigger").click()
    document.querySelector("#next-open-trigger").click()

    expect(firstContent.dataset.state).toBe("closed")
    expect(nextContent.dataset.state).toBe("open")
    expect(document.querySelector("#first-open-trigger").getAttribute("aria-expanded")).toBe("false")
    nextRoot.remove()
    await flushStimulus()
    await harness.disconnect(firstRoot)
  })

  it("activates default div items with Enter and Space", async () => {
    vi.useFakeTimers()
    const harness = await mount(dropdownFixture("keyboard-item"))
    const root = document.querySelector("#keyboard-item")
    const trigger = document.querySelector("#keyboard-item-trigger")
    const content = document.querySelector("#keyboard-item-content")
    const item = document.querySelector("#keyboard-item-first")
    const onActivate = vi.fn()
    item.addEventListener("click", onActivate)

    trigger.click()
    item.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "Enter" }))
    expect(onActivate).toHaveBeenCalledTimes(1)
    expect(content.dataset.state).toBe("closed")

    trigger.click()
    item.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: " " }))
    expect(onActivate).toHaveBeenCalledTimes(2)
    expect(content.dataset.state).toBe("closed")
    await harness.disconnect(root)
  })

  it("closes when focus leaves the open popover branch", async () => {
    vi.useFakeTimers()
    const harness = await mount(dropdownFixture("focus-leave"))
    const root = document.querySelector("#focus-leave")
    const content = document.querySelector("#focus-leave-content")
    const trigger = document.querySelector("#focus-leave-trigger")

    trigger.click()
    trigger.focus()
    expect(content.dataset.state).toBe("closed")
    await harness.disconnect(root)
  })

  it("opens a context menu at the pointer and cancels outside-click exit on disconnect", async () => {
    vi.useFakeTimers()
    const pointerdownBaseline = listenerCount(document, "pointerdown")
    const harness = await mount(`<div id="peer-auto" popover="auto">Peer</div>${contextFixture("context")}`)
    const root = document.querySelector("#context")
    const peer = document.querySelector("#peer-auto")
    const trigger = document.querySelector("#context-trigger")
    const content = document.querySelector("#context-content")

    trigger.click()
    expect(content.matches(":popover-open")).toBe(false)

    const event = new MouseEvent("contextmenu", {
      bubbles: true,
      cancelable: true,
      clientX: 24,
      clientY: 32,
    })
    peer.showPopover()
    trigger.dispatchEvent(event)
    expect(event.defaultPrevented).toBe(true)
    expect(content.matches(":popover-open")).toBe(true)
    expect(content.dataset.state).toBe("open")
    expect(content.dataset.side).toBe("right")
    expect(content.style.left).toBe("24px")
    expect(content.style.top).toBe("36px")
    expect(peer.matches(":popover-open")).toBe(false)
    expect(listenerCount(document, "pointerdown")).toBe(pointerdownBaseline + 1)

    trigger.focus()
    expect(content.dataset.state).toBe("closed")
    trigger.dispatchEvent(new MouseEvent("contextmenu", {
      bubbles: true,
      cancelable: true,
      clientX: 24,
      clientY: 32,
    }))
    trigger.dispatchEvent(new Event("pointerdown", { bubbles: true }))
    expect(content.dataset.state).toBe("closed")

    trigger.dispatchEvent(new MouseEvent("contextmenu", {
      bubbles: true,
      cancelable: true,
      clientX: 24,
      clientY: 32,
    }))
    content.querySelector("[role='menuitem']").dispatchEvent(
      new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "Escape" }),
    )
    expect(content.dataset.state).toBe("closed")
    expect(document.activeElement).toBe(trigger)
    expect(trigger.getAttribute("aria-expanded")).toBe(null)

    trigger.dispatchEvent(new MouseEvent("contextmenu", {
      bubbles: true,
      cancelable: true,
      clientX: 24,
      clientY: 32,
    }))
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
    expect(listenerCount(root, "focusout")).toBe(0)
    expect(listenerCount(document, "pointerdown")).toBe(pointerdownBaseline)
    expect(listenerCount(content, "toggle")).toBe(0)
    expect(listenerCount(content, "animationend")).toBe(0)
    expect(listenerCount(content, "animationcancel")).toBe(0)
    expect(vi.getTimerCount()).toBe(0)
    expect(content.matches(":popover-open")).toBe(false)
    peer.remove()

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
    expect(resizeObserverCount()).toBe(1)
    submenuTrigger.click()
    expect(submenu.matches(":popover-open")).toBe(true)
    expect(submenu.dataset.state).toBe("open")
    expect(resizeObserverCount()).toBe(2)
    expect(intersectionObserverCount()).toBe(2)

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
    expect(resizeObserverCount()).toBe(0)
    expect(intersectionObserverCount()).toBe(0)
    expect(listenerCount(submenu, "toggle")).toBe(0)
    expect(listenerCount(submenu, "animationend")).toBe(0)
    expect(listenerCount(submenu, "animationcancel")).toBe(0)
    expect(vi.getTimerCount()).toBe(0)
  })

  it("closes one submenu level per Escape and restores focus to its owning trigger", async () => {
    vi.useFakeTimers()
    const harness = await mount(submenuFixture("escape"))
    const root = document.querySelector("#escape")
    const trigger = document.querySelector("#escape-trigger")
    const content = document.querySelector("#escape-content")
    const submenuTrigger = document.querySelector("#escape-sub-trigger")
    const submenu = document.querySelector("#escape-sub")
    const nestedItem = submenu.querySelector("[role='menuitem']")

    trigger.click()
    submenuTrigger.click()
    expect(document.activeElement).toBe(nestedItem)

    nestedItem.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "Tab" }))
    expect(submenu.dataset.state).toBe("closed")
    expect(content.dataset.state).toBe("closed")

    trigger.click()
    submenuTrigger.click()

    nestedItem.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "Escape" }))
    expect(submenu.dataset.state).toBe("closed")
    expect(content.dataset.state).toBe("open")
    expect(document.activeElement).toBe(submenuTrigger)

    submenuTrigger.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "Escape" }))
    expect(content.dataset.state).toBe("closed")
    expect(document.activeElement).toBe(trigger)

    await harness.disconnect(root)
  })

  it("keeps a nested menu controller out of the outer item and close scopes", async () => {
    const harness = await mount(nestedControllerFixture("scoped"))
    const root = document.querySelector("#scoped")
    const outerContent = document.querySelector("#scoped-content")
    const innerContent = document.querySelector("#scoped-inner-content")
    const innerItem = document.querySelector("#scoped-inner-item")

    document.querySelector("#scoped-trigger").click()
    document.querySelector("#scoped-inner-trigger").click()
    expect(outerContent.dataset.state).toBe("open")
    expect(innerContent.dataset.state).toBe("open")
    expect(document.activeElement).toBe(innerItem)

    innerItem.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "Escape" }))
    expect(innerContent.dataset.state).toBe("closed")
    expect(outerContent.dataset.state).toBe("open")
    expect(document.activeElement).toBe(document.querySelector("#scoped-inner-trigger"))

    await harness.disconnect(root)
  })
})
