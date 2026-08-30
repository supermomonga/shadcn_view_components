import { describe, expect, it } from "vitest"

import { listenerCount } from "./support/listener_ledger.js"
import { mount } from "./support/stimulus.js"

function toggleFixture(id, state) {
  return `
    <button
      id="${id}"
      type="button"
      data-controller="shadcn--toggle"
      data-action="shadcn--toggle#toggle"
      data-state="${state}"
    >${id}</button>
  `
}

describe("shadcn--toggle", () => {
  it("toggles one root without changing another and releases its action listener", async () => {
    const harness = await mount(`${toggleFixture("first", "off")}${toggleFixture("second", "on")}`)
    const first = document.querySelector("#first")
    const second = document.querySelector("#second")

    expect(first.getAttribute("aria-pressed")).toBe("false")
    expect(second.getAttribute("aria-pressed")).toBe("true")

    first.click()
    expect(first.dataset.state).toBe("on")
    expect(first.getAttribute("aria-pressed")).toBe("true")
    expect(second.dataset.state).toBe("on")
    expect(second.getAttribute("aria-pressed")).toBe("true")

    first.click()
    expect(first.dataset.state).toBe("off")
    expect(first.getAttribute("aria-pressed")).toBe("false")

    expect(listenerCount(first, "click")).toBe(1)
    await harness.disconnect(first)
    expect(listenerCount(first, "click")).toBe(0)
    first.click()
    expect(first.dataset.state).toBe("off")
  })
})
