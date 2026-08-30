import { describe, expect, it } from "vitest"

import { listenerCount } from "./support/listener_ledger.js"
import { mount } from "./support/stimulus.js"

function commandFixture(id) {
  return `
    <section id="${id}" data-controller="shadcn--command">
      <input
        id="${id}-input"
        data-slot="command-input"
        data-action="input->shadcn--command#filter"
      >
      <p id="${id}-empty" data-slot="command-empty" hidden>Empty</p>
      <div id="${id}-group" data-slot="command-group">
        <div id="${id}-alpha" role="option" data-slot="command-item" data-value="alpha" data-selected="false">Alpha</div>
        <div id="${id}-beta" role="option" data-slot="command-item" data-value="beta" data-selected="false">Beta</div>
        <div id="${id}-gamma" role="option" data-slot="command-item" data-value="gamma" data-selected="false">Gamma</div>
      </div>
    </section>
  `
}

function keydown(element, key) {
  element.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key }))
}

describe("shadcn--command", () => {
  it("filters and navigates one root without changing another root", async () => {
    const harness = await mount(`${commandFixture("first")}${commandFixture("second")}`)
    const firstRoot = document.querySelector("#first")
    const firstInput = document.querySelector("#first-input")
    const secondAlpha = document.querySelector("#second-alpha")

    expect(document.querySelector("#first-alpha")?.getAttribute("data-selected")).toBe("true")
    expect(secondAlpha?.getAttribute("data-selected")).toBe("true")

    firstInput.value = "beta"
    firstInput.dispatchEvent(new Event("input", { bubbles: true }))
    expect(document.querySelector("#first-alpha")?.hidden).toBe(true)
    expect(document.querySelector("#first-beta")?.hidden).toBe(false)
    expect(document.querySelector("#first-beta")?.getAttribute("aria-selected")).toBe("true")
    expect(secondAlpha?.hidden).toBe(false)

    firstInput.value = "zzz"
    firstInput.dispatchEvent(new Event("input", { bubbles: true }))
    expect(document.querySelector("#first-empty")?.hidden).toBe(false)
    expect(document.querySelector("#first-group")?.hidden).toBe(true)

    firstInput.value = ""
    firstInput.dispatchEvent(new Event("input", { bubbles: true }))
    keydown(firstInput, "End")
    expect(document.querySelector("#first-gamma")?.dataset.selected).toBe("true")
    keydown(firstInput, "Home")
    keydown(firstInput, "ArrowDown")
    expect(document.querySelector("#first-beta")?.dataset.selected).toBe("true")
    expect(secondAlpha?.dataset.selected).toBe("true")

    expect(listenerCount(firstRoot, "keydown")).toBe(1)
    expect(listenerCount(firstInput, "input")).toBe(1)
    await harness.disconnect(firstRoot)
    expect(listenerCount(firstRoot, "keydown")).toBe(0)
    expect(listenerCount(firstInput, "input")).toBe(0)
  })
})
