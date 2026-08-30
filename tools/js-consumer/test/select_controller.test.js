import { describe, expect, it, vi } from "vitest"

import { animationEvent, intersectionObserverCount, resizeObserverCount } from "./support/browser.js"
import { listenerCount } from "./support/listener_ledger.js"
import { flushStimulus, mount } from "./support/stimulus.js"

function selectFixture(id, { disabled = false, initialValue = null } = {}) {
  const value = initialValue ?? ""
  const valuePresent = initialValue !== null
  const idAttribute = id ? `id="${id}"` : ""

  return `
    <section
      ${idAttribute}
      data-controller="shadcn--select"
      data-action="keydown->shadcn--select#navigate focusout->shadcn--select#focusOut"
      ${disabled ? "data-disabled=\"true\"" : ""}
    >
      <input
        type="hidden"
        name="framework"
        value="${value}"
        data-slot="select-input"
        data-value-present="${valuePresent}"
      >
      <button
        type="button"
        data-slot="select-trigger"
        data-action="click->shadcn--select#toggle"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded="false"
      ><span data-slot="select-value">Choose a framework</span></button>
      <div data-slot="select-content" popover="auto" data-state="closed">
        <div data-slot="select-scroll-up-button" data-scroll-direction="up" data-action="mouseenter->shadcn--select#startScroll mouseleave->shadcn--select#stopScroll" hidden></div>
        <div role="listbox" tabindex="-1">
          <div data-slot="select-group" role="group">
            <div data-slot="select-label">Frameworks</div>
            <div
              role="option"
              data-slot="select-item"
              data-value="alpha"
              data-selected="false"
              tabindex="-1"
              aria-selected="false"
              data-action="click->shadcn--select#select mouseenter->shadcn--select#highlight"
            ><span>Alpha</span><span data-indicator hidden>Selected</span></div>
            <div
              role="option"
              data-slot="select-item"
              data-value="beta"
              data-selected="false"
              tabindex="-1"
              aria-selected="false"
              data-action="click->shadcn--select#select mouseenter->shadcn--select#highlight"
            ><span>Beta</span><span data-indicator hidden>Selected</span></div>
            <div
              role="option"
              data-slot="select-item"
              data-value="gamma"
              data-selected="false"
              data-disabled
              tabindex="-1"
              aria-selected="false"
              aria-disabled="true"
              data-action="click->shadcn--select#select mouseenter->shadcn--select#highlight"
            ><span>Gamma</span><span data-indicator hidden>Selected</span></div>
          </div>
        </div>
        <div data-slot="select-scroll-down-button" data-scroll-direction="down" data-action="mouseenter->shadcn--select#startScroll mouseleave->shadcn--select#stopScroll" hidden></div>
      </div>
    </section>
  `
}

function nestedSelectFixture() {
  return selectFixture("nested-outer").replace(
    "        <div data-slot=\"select-scroll-up-button\"",
    `${selectFixture("nested-inner")}\n        <div data-slot="select-scroll-up-button"`,
  )
}

function keydown(element, key) {
  const event = new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key })
  element.dispatchEvent(event)
  return event
}

describe("shadcn--select", () => {
  it("derives display and ARIA from each root's initial hidden value", async () => {
    const harness = await mount(`
      ${selectFixture("first", { initialValue: "beta" })}
      ${selectFixture("second")}
    `)
    const firstRoot = document.querySelector("#first")
    const firstTrigger = document.querySelector("#first [data-slot='select-trigger']")
    const firstValue = document.querySelector("#first [data-slot='select-value']")
    const firstListbox = document.querySelector("#first [role='listbox']")
    const firstGroup = document.querySelector("#first [data-slot='select-group']")
    const firstLabel = document.querySelector("#first [data-slot='select-label']")
    const firstItems = [...document.querySelectorAll("#first [role='option']")]
    const secondTrigger = document.querySelector("#second [data-slot='select-trigger']")
    const secondValue = document.querySelector("#second [data-slot='select-value']")
    const secondItems = [...document.querySelectorAll("#second [role='option']")]

    expect(firstValue.textContent).toBe("Beta")
    expect(firstValue.hasAttribute("data-placeholder")).toBe(false)
    expect(firstTrigger.hasAttribute("data-placeholder")).toBe(false)
    expect(firstTrigger.getAttribute("aria-label")).toBe("Beta")
    expect(firstItems.map((item) => item.getAttribute("aria-selected"))).toEqual(["false", "true", "false"])
    expect(firstItems[1].querySelector("[data-indicator]").hidden).toBe(false)

    expect(secondValue.textContent).toBe("Choose a framework")
    expect(secondValue.hasAttribute("data-placeholder")).toBe(true)
    expect(secondTrigger.hasAttribute("data-placeholder")).toBe(true)
    expect(secondTrigger.getAttribute("aria-label")).toBe("Choose a framework")
    expect(secondItems.every((item) => item.getAttribute("aria-selected") === "false")).toBe(true)

    expect(firstTrigger.id).toBe("first-trigger")
    expect(firstListbox.id).toBe("first-listbox")
    expect(firstTrigger.getAttribute("aria-controls")).toBe(firstListbox.id)
    expect(firstListbox.getAttribute("aria-labelledby")).toBe(firstTrigger.id)
    expect(firstItems.map((item) => item.id)).toEqual([
      "first-option-1",
      "first-option-2",
      "first-option-3",
    ])
    expect(firstLabel.id).toBe("first-group-1-label")
    expect(firstGroup.getAttribute("aria-labelledby")).toBe(firstLabel.id)

    firstItems[0].click()
    expect(document.querySelector("#first [data-slot='select-input']").value).toBe("alpha")
    expect(firstTrigger.getAttribute("aria-label")).toBe("Alpha")
    expect(secondValue.textContent).toBe("Choose a framework")
    expect(secondItems.every((item) => item.getAttribute("aria-selected") === "false")).toBe(true)

    await harness.disconnect(firstRoot)
  })

  it("preserves authored IDs and ARIA relationships", async () => {
    const html = selectFixture("authored")
      .replace(
        "role=\"combobox\"",
        "id=\"kept-trigger\" role=\"combobox\" aria-label=\"独自ラベル\" aria-controls=\"custom-popup\"",
      )
      .replace(
        "<div role=\"listbox\"",
        "<div id=\"kept-listbox\" role=\"listbox\" aria-labelledby=\"external-label\"",
      )
    const harness = await mount(html)
    const root = document.querySelector("#authored")
    const trigger = document.querySelector("#kept-trigger")
    const listbox = document.querySelector("#kept-listbox")

    expect(trigger.getAttribute("aria-label")).toBe("独自ラベル")
    expect(trigger.getAttribute("aria-controls")).toBe("custom-popup")
    expect(listbox.getAttribute("aria-labelledby")).toBe("external-label")
    await harness.disconnect(root)
  })

  it("commits clicks once, dispatches form events, and skips disabled state", async () => {
    vi.useFakeTimers()
    const harness = await mount(`${selectFixture("enabled")}${selectFixture("disabled", { disabled: true })}`)
    const root = document.querySelector("#enabled")
    const trigger = document.querySelector("#enabled [data-slot='select-trigger']")
    const content = document.querySelector("#enabled [data-slot='select-content']")
    const input = document.querySelector("#enabled [data-slot='select-input']")
    const value = document.querySelector("#enabled [data-slot='select-value']")
    const beta = document.querySelector("#enabled [data-value='beta']")
    const gamma = document.querySelector("#enabled [data-value='gamma']")
    const onInput = vi.fn()
    const onChange = vi.fn()
    input.addEventListener("input", onInput)
    input.addEventListener("change", onChange)

    keydown(trigger, "ArrowDown")
    expect(content.matches(":popover-open")).toBe(true)
    expect(content.hasAttribute("inert")).toBe(false)
    gamma.click()
    expect(input.dataset.valuePresent).toBe("false")
    expect(content.dataset.state).toBe("open")

    beta.click()
    expect(input.value).toBe("beta")
    expect(input.dataset.valuePresent).toBe("true")
    expect(value.textContent).toBe("Beta")
    expect(beta.getAttribute("aria-selected")).toBe("true")
    expect(onInput).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenCalledTimes(1)

    content.dispatchEvent(animationEvent("animationend", "exit"))
    trigger.click()
    beta.click()
    expect(onInput).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenCalledTimes(1)

    const disabledTrigger = document.querySelector("#disabled [data-slot='select-trigger']")
    const disabledContent = document.querySelector("#disabled [data-slot='select-content']")
    const disabledInput = document.querySelector("#disabled [data-slot='select-input']")
    expect(disabledTrigger.disabled).toBe(true)
    expect(keydown(disabledTrigger, "ArrowDown").defaultPrevented).toBe(false)
    expect(disabledContent.matches(":popover-open")).toBe(false)
    document.querySelector("#disabled [data-value='alpha']").click()
    expect(disabledInput.dataset.valuePresent).toBe("false")

    await harness.disconnect(root)
  })

  it("supports arrows, Home, End, Enter, Space, and Escape while skipping disabled options", async () => {
    vi.useFakeTimers()
    const harness = await mount(selectFixture("keyboard"))
    const root = document.querySelector("#keyboard")
    const trigger = document.querySelector("#keyboard [data-slot='select-trigger']")
    const content = document.querySelector("#keyboard [data-slot='select-content']")
    const input = document.querySelector("#keyboard [data-slot='select-input']")
    const alpha = document.querySelector("#keyboard [data-value='alpha']")
    const beta = document.querySelector("#keyboard [data-value='beta']")
    const gamma = document.querySelector("#keyboard [data-value='gamma']")

    expect(keydown(trigger, "ArrowDown").defaultPrevented).toBe(true)
    expect(content.matches(":popover-open")).toBe(true)
    expect(trigger.getAttribute("aria-activedescendant")).toBe(alpha.id)
    expect(document.activeElement).toBe(trigger)

    keydown(trigger, "ArrowDown")
    expect(trigger.getAttribute("aria-activedescendant")).toBe(beta.id)
    content.dispatchEvent(new Event("toggle"))
    expect(trigger.getAttribute("aria-activedescendant")).toBe(beta.id)
    keydown(trigger, "ArrowDown")
    expect(trigger.getAttribute("aria-activedescendant")).toBe(alpha.id)
    keydown(trigger, "ArrowUp")
    expect(trigger.getAttribute("aria-activedescendant")).toBe(beta.id)
    keydown(trigger, "Home")
    expect(trigger.getAttribute("aria-activedescendant")).toBe(alpha.id)
    keydown(trigger, "End")
    expect(trigger.getAttribute("aria-activedescendant")).toBe(beta.id)
    expect(gamma.dataset.highlighted).toBe("false")

    keydown(trigger, "Enter")
    expect(input.value).toBe("beta")
    expect(content.dataset.state).toBe("closed")
    expect(trigger.hasAttribute("aria-activedescendant")).toBe(false)
    content.dispatchEvent(animationEvent("animationend", "exit"))

    keydown(trigger, "Home")
    expect(trigger.getAttribute("aria-activedescendant")).toBe(alpha.id)
    keydown(trigger, " ")
    expect(input.value).toBe("alpha")
    content.dispatchEvent(animationEvent("animationend", "exit"))

    keydown(trigger, "End")
    expect(trigger.getAttribute("aria-activedescendant")).toBe(beta.id)
    keydown(trigger, "Escape")
    expect(input.value).toBe("alpha")
    expect(content.dataset.state).toBe("closed")
    expect(trigger.getAttribute("aria-expanded")).toBe("false")
    expect(document.activeElement).toBe(trigger)

    await harness.disconnect(root)
  })

  it("keeps nested content ownership and keyboard state isolated", async () => {
    vi.useFakeTimers()
    const harness = await mount(nestedSelectFixture())
    const outer = document.querySelector("#nested-outer")
    const inner = document.querySelector("#nested-inner")
    const outerController = harness.controller(outer, "shadcn--select")
    const outerTrigger = outer.querySelector(":scope > [data-slot='select-trigger']")
    const outerContent = outer.querySelector(":scope > [data-slot='select-content']")
    const outerListbox = outerContent.querySelector(":scope > [role='listbox']")
    const outerScrollUp = outerContent.querySelector(":scope > [data-slot='select-scroll-up-button']")
    const outerScrollDown = outerContent.querySelector(":scope > [data-slot='select-scroll-down-button']")
    const outerItems = [...outerListbox.querySelectorAll("[role='option']")]
    const innerTrigger = inner.querySelector(":scope > [data-slot='select-trigger']")
    const innerContent = inner.querySelector(":scope > [data-slot='select-content']")
    const innerItems = [...inner.querySelectorAll("[role='option']")]

    expect(outerController.content).toBe(outerContent)
    expect(outerController.listbox).toBe(outerListbox)
    expect(outerController.scrollUpButton).toBe(outerScrollUp)
    expect(outerController.scrollDownButton).toBe(outerScrollDown)
    expect(outerTrigger.getAttribute("aria-controls")).toBe(outerListbox.id)

    keydown(outerTrigger, "ArrowDown")
    expect(outerTrigger.getAttribute("aria-activedescendant")).toBe(outerItems[0].id)
    keydown(innerTrigger, "ArrowDown")
    expect(innerTrigger.getAttribute("aria-activedescendant")).toBe(innerItems[0].id)
    expect(outerTrigger.getAttribute("aria-activedescendant")).toBe(outerItems[0].id)

    keydown(innerTrigger, "ArrowDown")
    expect(innerTrigger.getAttribute("aria-activedescendant")).toBe(innerItems[1].id)
    expect(outerTrigger.getAttribute("aria-activedescendant")).toBe(outerItems[0].id)

    keydown(innerTrigger, "Escape")
    expect(innerContent.dataset.state).toBe("closed")
    expect(outerContent.dataset.state).toBe("open")
    expect(outerTrigger.getAttribute("aria-expanded")).toBe("true")
    expect(outerTrigger.getAttribute("aria-activedescendant")).toBe(outerItems[0].id)
    await harness.disconnect(outer)
  })

  it("reopens during exit and preserves the hidden value across a clean reconnect", async () => {
    vi.useFakeTimers()
    const scrollBaseline = listenerCount(document, "scroll")
    const harness = await mount(selectFixture("lifecycle"))
    const root = document.querySelector("#lifecycle")
    const trigger = document.querySelector("#lifecycle [data-slot='select-trigger']")
    const content = document.querySelector("#lifecycle [data-slot='select-content']")
    const input = document.querySelector("#lifecycle [data-slot='select-input']")
    const value = document.querySelector("#lifecycle [data-slot='select-value']")
    const beta = document.querySelector("#lifecycle [data-value='beta']")
    const originalIds = [trigger.id, content.querySelector("[role='listbox']").id, beta.id]

    expect(listenerCount(content, "toggle")).toBe(1)
    trigger.click()
    vi.clearAllTimers()
    beta.click()
    expect(content.matches(":popover-open")).toBe(true)
    expect(content.dataset.state).toBe("closed")
    expect(content.hasAttribute("inert")).toBe(true)
    expect(listenerCount(content, "animationend")).toBe(1)
    expect(vi.getTimerCount()).toBeGreaterThanOrEqual(1)

    content.dispatchEvent(new Event("toggle"))
    expect(content.dataset.state).toBe("closed")
    expect(listenerCount(content, "animationend")).toBe(1)

    keydown(trigger, "ArrowDown")
    expect(content.matches(":popover-open")).toBe(true)
    expect(content.dataset.state).toBe("open")
    expect(input.value).toBe("beta")
    expect(listenerCount(content, "animationend")).toBe(0)
    expect(listenerCount(content, "animationcancel")).toBe(0)
    vi.runAllTimers()
    expect(content.matches(":popover-open")).toBe(true)
    expect(content.dataset.state).toBe("open")
    expect(vi.getTimerCount()).toBe(0)
    expect(listenerCount(document, "scroll")).toBe(scrollBaseline + 1)
    expect(resizeObserverCount()).toBe(1)
    expect(intersectionObserverCount()).toBe(1)

    trigger.click()
    expect(vi.getTimerCount()).toBeGreaterThanOrEqual(1)
    const pendingTimerCount = vi.getTimerCount()
    root.remove()
    await flushStimulus()
    expect(listenerCount(root, "keydown")).toBe(0)
    expect(listenerCount(trigger, "click")).toBe(0)
    expect(listenerCount(beta, "click")).toBe(0)
    expect(listenerCount(beta, "mouseenter")).toBe(0)
    expect(listenerCount(content, "toggle")).toBe(0)
    expect(listenerCount(content, "animationend")).toBe(0)
    expect(listenerCount(content, "animationcancel")).toBe(0)
    expect(listenerCount(document, "scroll")).toBe(scrollBaseline)
    expect(resizeObserverCount()).toBe(0)
    expect(intersectionObserverCount()).toBe(0)
    expect(vi.getTimerCount()).toBeLessThan(pendingTimerCount)
    vi.runAllTimers()
    expect(vi.getTimerCount()).toBe(0)
    expect(content.matches(":popover-open")).toBe(false)
    expect(content.dataset.state).toBe("closed")

    document.body.appendChild(root)
    await flushStimulus()
    expect(input.value).toBe("beta")
    expect(input.dataset.valuePresent).toBe("true")
    expect(value.textContent).toBe("Beta")
    expect(beta.getAttribute("aria-selected")).toBe("true")
    expect([trigger.id, content.querySelector("[role='listbox']").id, beta.id]).toEqual(originalIds)
    expect(trigger.getAttribute("aria-expanded")).toBe("false")
    expect(listenerCount(content, "toggle")).toBe(1)

    await harness.disconnect(root)
  })

  it("closes on Tab or focus leaving without stealing the next element's focus", async () => {
    vi.useFakeTimers()
    const harness = await mount(`${selectFixture("focus")}<button id="after">After</button>`)
    const root = document.querySelector("#focus")
    const trigger = document.querySelector("#focus [data-slot='select-trigger']")
    const content = document.querySelector("#focus [data-slot='select-content']")
    const beta = document.querySelector("#focus [data-value='beta']")
    const after = document.querySelector("#after")

    trigger.click()
    expect(document.activeElement).toBe(trigger)
    keydown(trigger, "Tab")
    after.focus()

    expect(content.dataset.state).toBe("closed")
    expect(trigger.getAttribute("aria-expanded")).toBe("false")
    expect(document.activeElement).toBe(after)

    await harness.disconnect(root)
  })

  it("keeps generated IDs unique and scrolls only through visible overflow controls", async () => {
    vi.useFakeTimers()
    const harness = await mount(`${selectFixture("shadcn-select-1")}${selectFixture(null)}`)
    const roots = [...document.querySelectorAll("[data-controller='shadcn--select']")]
    const anonymous = roots[1]
    const trigger = anonymous.querySelector("[data-slot='select-trigger']")
    const content = anonymous.querySelector("[data-slot='select-content']")
    const listbox = anonymous.querySelector("[role='listbox']")
    const up = anonymous.querySelector("[data-slot='select-scroll-up-button']")
    const down = anonymous.querySelector("[data-slot='select-scroll-down-button']")
    const items = [...anonymous.querySelectorAll("[role='option']")]

    expect(roots[0].id).toBe("shadcn-select-1")
    expect(roots[1].id).toMatch(/^shadcn-select-/)
    expect(roots[1].id).not.toBe(roots[0].id)
    expect(trigger.id).toBe(`${roots[1].id}-trigger`)
    expect(listbox.id).toBe(`${roots[1].id}-listbox`)
    Object.defineProperties(listbox, {
      clientHeight: { configurable: true, value: 60 },
      scrollHeight: { configurable: true, value: 180 },
      scrollTop: { configurable: true, value: 0, writable: true },
    })
    for (const item of items) {
      Object.defineProperty(item, "offsetHeight", { configurable: true, value: 30 })
      item.scrollIntoView = vi.fn()
    }

    trigger.click()
    expect(up.hidden).toBe(true)
    expect(down.hidden).toBe(false)
    expect(items[0].scrollIntoView).toHaveBeenCalledWith({ block: "nearest" })

    down.dispatchEvent(new MouseEvent("mouseenter"))
    expect(listbox.scrollTop).toBe(30)
    expect(up.hidden).toBe(false)
    vi.advanceTimersByTime(120)
    expect(listbox.scrollTop).toBe(120)
    expect(down.hidden).toBe(true)
    expect(vi.getTimerCount()).toBe(0)

    await harness.disconnect(anonymous)
  })
})
