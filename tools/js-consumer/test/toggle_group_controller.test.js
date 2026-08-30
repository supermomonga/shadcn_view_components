import { describe, expect, it } from "vitest"

import { listenerCount } from "./support/listener_ledger.js"
import { mount } from "./support/stimulus.js"

function toggleGroupFixture(id, type, firstState = "on") {
  return `
    <div id="${id}" data-controller="shadcn--toggle-group" data-type="${type}">
      <button
        id="${id}-one"
        type="button"
        data-slot="toggle-group-item"
        data-state="${firstState}"
        aria-pressed="${firstState === "on"}"
        data-action="shadcn--toggle-group#toggleItem"
      >One</button>
      <button
        id="${id}-two"
        type="button"
        data-slot="toggle-group-item"
        data-state="off"
        aria-pressed="false"
        data-action="shadcn--toggle-group#toggleItem"
      >Two</button>
    </div>
  `
}

describe("shadcn--toggle-group", () => {
  it("keeps single selection exclusive without changing another root", async () => {
    const harness = await mount(`${toggleGroupFixture("first", "single")}${toggleGroupFixture("second", "single")}`)
    const firstRoot = document.querySelector("#first")
    const firstOne = document.querySelector("#first-one")
    const firstTwo = document.querySelector("#first-two")
    const secondOne = document.querySelector("#second-one")
    const secondTwo = document.querySelector("#second-two")

    firstTwo.click()
    expect(firstOne.dataset.state).toBe("off")
    expect(firstOne.getAttribute("aria-pressed")).toBe("false")
    expect(firstTwo.dataset.state).toBe("on")
    expect(firstTwo.getAttribute("aria-pressed")).toBe("true")
    expect(secondOne.dataset.state).toBe("on")
    expect(secondTwo.dataset.state).toBe("off")

    expect(listenerCount(firstTwo, "click")).toBe(1)
    await harness.disconnect(firstRoot)
    expect(listenerCount(firstTwo, "click")).toBe(0)
    firstTwo.click()
    expect(firstTwo.dataset.state).toBe("on")
  })

  it("toggles multiple items independently", async () => {
    const harness = await mount(toggleGroupFixture("multiple", "multiple"))
    const root = document.querySelector("#multiple")
    const one = document.querySelector("#multiple-one")
    const two = document.querySelector("#multiple-two")

    two.click()
    expect(one.dataset.state).toBe("on")
    expect(two.dataset.state).toBe("on")
    expect(two.getAttribute("aria-pressed")).toBe("true")

    one.click()
    expect(one.dataset.state).toBe("off")
    expect(two.dataset.state).toBe("on")
    await harness.disconnect(root)
  })
})
