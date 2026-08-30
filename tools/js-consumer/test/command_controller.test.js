import { describe, expect, it, vi } from "vitest"

import { animationEvent } from "./support/browser.js"
import { listenerCount } from "./support/listener_ledger.js"
import { flushStimulus, mount } from "./support/stimulus.js"

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

function comboboxFixture(id) {
  return `
    <section id="${id}" data-controller="shadcn--command">
      <input
        id="${id}-input"
        role="combobox"
        aria-expanded="false"
        data-action="input->shadcn--command#filter"
      >
      <button id="${id}-trigger" type="button" data-action="shadcn--command#toggleList">Open</button>
      <div id="${id}-list" role="listbox" popover="auto" data-state="closed">
        <div data-slot="combobox-group">
          <button
            id="${id}-rails"
            type="button"
            role="option"
            data-slot="combobox-item"
            data-value="rails"
            data-selected="false"
            data-action="click->shadcn--command#select"
          >Rails<span data-indicator></span></button>
          <button
            id="${id}-hanami"
            type="button"
            role="option"
            data-slot="combobox-item"
            data-value="hanami"
            data-selected="false"
            data-action="click->shadcn--command#select"
          >Hanami<span data-indicator hidden></span></button>
        </div>
      </div>
    </section>
  `
}

function chipsFixture(id) {
  return `
    <section id="${id}" data-controller="shadcn--command">
      <div id="${id}-chips" data-slot="combobox-chips">
        <div id="${id}-rails" data-slot="combobox-chip">Rails<button
          type="button"
          data-slot="combobox-chip-remove"
          data-action="shadcn--command#removeChip"
        >Remove</button></div>
        <input id="${id}-input" data-slot="combobox-chip-input">
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

  it("opens the list and selects its highlighted item through DOM actions", async () => {
    vi.useFakeTimers()
    const harness = await mount(comboboxFixture("combo"))
    const root = document.querySelector("#combo")
    const input = document.querySelector("#combo-input")
    const trigger = document.querySelector("#combo-trigger")
    const list = document.querySelector("#combo-list")
    const railsIndicator = document.querySelector("#combo-rails [data-indicator]")
    const hanami = document.querySelector("#combo-hanami")
    const hanamiIndicator = document.querySelector("#combo-hanami [data-indicator]")

    trigger.click()
    expect(list.matches(":popover-open")).toBe(true)
    expect(list.dataset.state).toBe("open")
    expect(list.hasAttribute("data-open")).toBe(true)
    expect(input.getAttribute("aria-expanded")).toBe("true")

    hanami.click()
    expect(input.value).toBe("Hanami")
    expect(hanami.dataset.selected).toBe("true")
    expect(hanamiIndicator.hidden).toBe(false)
    expect(railsIndicator.hidden).toBe(true)
    expect(list.dataset.state).toBe("closed")
    expect(listenerCount(list, "animationend")).toBe(1)

    list.dispatchEvent(animationEvent("animationend", "exit"))
    expect(list.matches(":popover-open")).toBe(false)
    expect(input.getAttribute("aria-expanded")).toBe("false")
    expect(listenerCount(list, "animationend")).toBe(0)
    expect(listenerCount(list, "animationcancel")).toBe(0)
    expect(vi.getTimerCount()).toBe(0)

    await harness.disconnect(root)
  })

  it("cancels an obsolete list exit when reopened and when disconnected", async () => {
    vi.useFakeTimers()
    const harness = await mount(comboboxFixture("combo"))
    const root = document.querySelector("#combo")
    const input = document.querySelector("#combo-input")
    const trigger = document.querySelector("#combo-trigger")
    const list = document.querySelector("#combo-list")

    trigger.click()
    document.querySelector("#combo-rails").click()
    expect(vi.getTimerCount()).toBe(1)

    trigger.click()
    expect(list.dataset.state).toBe("open")
    expect(listenerCount(list, "animationend")).toBe(0)
    expect(listenerCount(list, "animationcancel")).toBe(0)
    expect(vi.getTimerCount()).toBe(0)

    trigger.click()
    expect(vi.getTimerCount()).toBe(1)
    root.remove()
    await flushStimulus()
    expect(listenerCount(root, "keydown")).toBe(0)
    expect(listenerCount(list, "toggle")).toBe(0)
    expect(listenerCount(list, "animationend")).toBe(0)
    expect(listenerCount(list, "animationcancel")).toBe(0)
    expect(vi.getTimerCount()).toBe(0)
    expect(list.matches(":popover-open")).toBe(false)
    expect(list.dataset.state).toBe("closed")

    document.body.appendChild(root)
    await flushStimulus()
    expect(list.matches(":popover-open")).toBe(false)
    expect(list.dataset.state).toBe("closed")
    expect(input.getAttribute("aria-expanded")).toBe("false")
    await harness.disconnect(root)
  })

  it("adds and removes dynamically inserted chips using their data actions", async () => {
    const harness = await mount(chipsFixture("tags"))
    const root = document.querySelector("#tags")
    const input = document.querySelector("#tags-input")
    const chips = document.querySelector("#tags-chips")

    input.value = "Sinatra"
    keydown(input, "Enter")
    await flushStimulus()
    expect(chips.querySelectorAll("[data-slot='combobox-chip']")).toHaveLength(2)
    const sinatra = [...chips.querySelectorAll("[data-slot='combobox-chip']")]
      .find((chip) => chip.textContent.includes("Sinatra"))
    sinatra.querySelector("[data-slot='combobox-chip-remove']").click()
    expect(chips.querySelectorAll("[data-slot='combobox-chip']")).toHaveLength(1)

    document.querySelector("#tags-rails [data-slot='combobox-chip-remove']").click()
    expect(chips.querySelectorAll("[data-slot='combobox-chip']")).toHaveLength(0)

    input.value = "Zzz"
    keydown(input, "Enter")
    await flushStimulus()
    const recreated = chips.querySelector("[data-slot='combobox-chip']")
    expect(recreated.textContent).toContain("Zzz")
    recreated.querySelector("[data-slot='combobox-chip-remove']").click()
    expect(chips.querySelectorAll("[data-slot='combobox-chip']")).toHaveLength(0)

    await harness.disconnect(root)
  })
})
