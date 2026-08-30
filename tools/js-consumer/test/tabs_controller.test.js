import { describe, expect, it } from "vitest"

import { listenerCount } from "./support/listener_ledger.js"
import { mount } from "./support/stimulus.js"

function tabsFixture(id, orientation = "horizontal", active = "one") {
  return `
    <section id="${id}" data-controller="shadcn--tabs" data-orientation="${orientation}">
      <div role="tablist">
        <button
          id="${id}-one"
          role="tab"
          data-slot="tabs-trigger"
          data-value="one"
          ${active === "one" ? "data-active" : ""}
          data-action="click->shadcn--tabs#select keydown->shadcn--tabs#navigate"
        >One</button>
        <button
          id="${id}-two"
          role="tab"
          data-slot="tabs-trigger"
          data-value="two"
          ${active === "two" ? "data-active" : ""}
          data-action="click->shadcn--tabs#select keydown->shadcn--tabs#navigate"
        >Two</button>
      </div>
      <div id="${id}-panel-one" role="tabpanel" data-slot="tabs-content" data-value="one">Panel one</div>
      <div id="${id}-panel-two" role="tabpanel" data-slot="tabs-content" data-value="two">Panel two</div>
    </section>
  `
}

function keydown(element, key) {
  element.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key }))
}

describe("shadcn--tabs", () => {
  it("selects and wraps horizontal tabs without changing another root", async () => {
    const harness = await mount(`${tabsFixture("first")}${tabsFixture("second", "horizontal", "two")}`)
    const firstRoot = document.querySelector("#first")
    const firstOne = document.querySelector("#first-one")
    const firstTwo = document.querySelector("#first-two")
    const secondOne = document.querySelector("#second-one")
    const secondTwo = document.querySelector("#second-two")

    expect(firstOne.getAttribute("aria-selected")).toBe("true")
    expect(firstOne.tabIndex).toBe(0)
    expect(document.querySelector("#first-panel-one").hidden).toBe(false)
    expect(document.querySelector("#first-panel-two").hidden).toBe(true)
    expect(secondTwo.getAttribute("aria-selected")).toBe("true")

    firstTwo.click()
    expect(firstTwo.getAttribute("aria-selected")).toBe("true")
    expect(firstOne.getAttribute("aria-selected")).toBe("false")
    expect(document.querySelector("#first-panel-one").hidden).toBe(true)
    expect(document.querySelector("#first-panel-two").hidden).toBe(false)
    expect(secondOne.getAttribute("aria-selected")).toBe("false")
    expect(secondTwo.getAttribute("aria-selected")).toBe("true")

    keydown(firstTwo, "ArrowRight")
    expect(firstOne.getAttribute("aria-selected")).toBe("true")
    expect(document.activeElement).toBe(firstOne)

    expect(listenerCount(firstOne, "click")).toBe(1)
    expect(listenerCount(firstOne, "keydown")).toBe(1)
    await harness.disconnect(firstRoot)
    expect(listenerCount(firstOne, "click")).toBe(0)
    expect(listenerCount(firstOne, "keydown")).toBe(0)
  })

  it("uses only up and down arrows for a vertical root", async () => {
    const harness = await mount(tabsFixture("vertical", "vertical"))
    const root = document.querySelector("#vertical")
    const one = document.querySelector("#vertical-one")
    const two = document.querySelector("#vertical-two")

    keydown(one, "ArrowRight")
    expect(one.getAttribute("aria-selected")).toBe("true")

    keydown(one, "ArrowDown")
    expect(two.getAttribute("aria-selected")).toBe("true")
    expect(document.activeElement).toBe(two)

    keydown(two, "ArrowUp")
    expect(one.getAttribute("aria-selected")).toBe("true")
    await harness.disconnect(root)
  })
})
