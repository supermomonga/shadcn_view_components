import { describe, expect, it } from "vitest"

import { listenerCount } from "./support/listener_ledger.js"
import { mount } from "./support/stimulus.js"

function tabsFixture(id, orientation = "horizontal", active = "one") {
  return `
    <section id="${id}" data-controller="shadcn--tabs" data-orientation="${orientation}">
      <div data-slot="tabs-list" role="tablist">
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
    expect(firstOne.getAttribute("aria-controls")).toBe("first-panel-one")
    expect(document.querySelector("#first-panel-one").getAttribute("aria-labelledby")).toBe("first-one")
    expect(document.querySelector("#first-panel-one").tabIndex).toBe(0)
    expect(firstRoot.querySelector("[role='tablist']").getAttribute("aria-orientation")).toBe("horizontal")
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
    expect(root.querySelector("[role='tablist']").getAttribute("aria-orientation")).toBe("vertical")
    await harness.disconnect(root)
  })

  it("moves to the first and last enabled tabs with Home and End", async () => {
    const html = tabsFixture("disabled")
      .replace('id="disabled-two"', 'id="disabled-two" disabled')
    const harness = await mount(html)
    const root = document.querySelector("#disabled")
    const one = document.querySelector("#disabled-one")
    const two = document.querySelector("#disabled-two")

    keydown(one, "End")
    expect(document.activeElement).toBe(one)
    expect(one.getAttribute("aria-selected")).toBe("true")

    two.click()
    expect(one.getAttribute("aria-selected")).toBe("true")
    expect(two.getAttribute("aria-selected")).toBe("false")
    expect(two.getAttribute("aria-controls")).toBe("disabled-panel-two")

    two.removeAttribute("disabled")
    keydown(one, "End")
    expect(document.activeElement).toBe(two)
    keydown(two, "Home")
    expect(document.activeElement).toBe(one)
    await harness.disconnect(root)
  })

  it("preserves consumer references and isolates a nested tabs root", async () => {
    const outer = tabsFixture("outer")
      .replace('id="outer-one"', 'id="outer-one" aria-controls="consumer-panel"')
      .replace('id="outer-panel-one"', 'id="outer-panel-one" aria-labelledby="consumer-trigger"')
      .replace("Panel one</div>", `Panel one${tabsFixture("inner")}</div>`)
    const harness = await mount(outer)
    const root = document.querySelector("#outer")
    const outerOne = document.querySelector("#outer-one")
    const outerTwo = document.querySelector("#outer-two")
    const innerOne = document.querySelector("#inner-one")
    const innerTwo = document.querySelector("#inner-two")

    expect(outerOne.getAttribute("aria-controls")).toBe("consumer-panel")
    expect(document.querySelector("#outer-panel-one").getAttribute("aria-labelledby")).toBe("consumer-trigger")
    outerTwo.click()
    expect(outerTwo.getAttribute("aria-selected")).toBe("true")
    expect(innerOne.getAttribute("aria-selected")).toBe("true")
    expect(innerTwo.getAttribute("aria-selected")).toBe("false")

    innerTwo.click()
    expect(innerTwo.getAttribute("aria-selected")).toBe("true")
    expect(outerTwo.getAttribute("aria-selected")).toBe("true")
    await harness.disconnect(root)
  })
})
