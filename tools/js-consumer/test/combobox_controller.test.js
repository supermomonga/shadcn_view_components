import { describe, expect, it, vi } from "vitest"

import { animationEvent } from "./support/browser.js"
import { listenerCount } from "./support/listener_ledger.js"
import { flushStimulus, mount } from "./support/stimulus.js"

function options(values) {
  return values.map((value) => `<option value="${value}" selected>${value}</option>`).join("")
}

function comboboxFixture(id, { disabled = false, required = false, values = ["rails"] } = {}) {
  return `
    <form id="${id}-form">
      <section id="${id}" data-controller="shadcn--combobox" ${disabled ? "inert" : ""}>
        <input
          id="${id}-input"
          role="combobox"
          aria-expanded="false"
          data-action="input->shadcn--combobox#filter"
        >
        <button id="${id}-trigger" type="button" data-action="shadcn--combobox#toggleList">Open</button>
        <div id="${id}-list" data-slot="combobox-content" role="listbox" popover="manual" data-state="closed">
          <div data-slot="combobox-group">
            <button id="${id}-rails" type="button" role="option" data-slot="combobox-item"
                    data-value="rails" data-selected="false"
                    data-action="click->shadcn--combobox#select">Ruby on Rails<span data-indicator hidden></span></button>
            <button id="${id}-hanami" type="button" role="option" data-slot="combobox-item"
                    data-value="hanami" data-selected="false"
                    data-action="click->shadcn--combobox#select">Hanami<span data-indicator hidden></span></button>
            <button id="${id}-disabled" type="button" role="option" data-slot="combobox-item"
                    data-value="disabled" data-selected="false" data-disabled aria-disabled="true"
                    data-action="click->shadcn--combobox#select">Disabled<span data-indicator hidden></span></button>
          </div>
        </div>
        <select data-slot="combobox-form-control" name="profile[framework]"
                ${disabled ? "disabled" : ""} ${required ? "required" : ""} tabindex="-1">
          ${options(values)}
        </select>
      </section>
    </form>
  `
}

function chip(value, label, id = "") {
  return `<div ${id ? `id="${id}"` : ""} data-slot="combobox-chip" data-value="${value}">
    <span data-slot="combobox-chip-label">${label}</span>
    <button type="button" data-slot="combobox-chip-remove"
            data-action="shadcn--combobox#removeChip">Remove</button>
  </div>`
}

function chipsFixture(id, { disabled = false, required = false, values = ["rails", "hanami"] } = {}) {
  const labels = { rails: "Rails", hanami: "Hanami", sinatra: "Sinatra Framework" }
  return `
    <form id="${id}-form">
      <section id="${id}" data-controller="shadcn--combobox" ${disabled ? "inert" : ""}>
        <div id="${id}-chips" data-slot="combobox-chips">
          ${values.map((value) => chip(value, labels[value] ?? value, `${id}-${value}`)).join("")}
          <input id="${id}-input" data-slot="combobox-chip-input"
                 data-action="input->shadcn--combobox#filter">
          <template data-slot="combobox-chip-template">
            ${chip("__template__", "__label__")}
          </template>
        </div>
        <button id="${id}-trigger" type="button" data-action="shadcn--combobox#toggleList">Open</button>
        <div id="${id}-list" data-slot="combobox-content" role="listbox" popover="manual" data-state="closed">
          <div data-slot="combobox-group">
            <button id="${id}-rails-item" type="button" role="option" data-slot="combobox-item"
                    data-value="rails" data-selected="false"
                    data-action="click->shadcn--combobox#select">Ruby on Rails<span data-indicator hidden></span></button>
            <button id="${id}-hanami-item" type="button" role="option" data-slot="combobox-item"
                    data-value="hanami" data-selected="false"
                    data-action="click->shadcn--combobox#select">Hanami<span data-indicator hidden></span></button>
            <button id="${id}-sinatra-item" type="button" role="option" data-slot="combobox-item"
                    data-value="sinatra" data-selected="false"
                    data-action="click->shadcn--combobox#select">Sinatra Framework<span data-indicator hidden></span></button>
          </div>
        </div>
        <select data-slot="combobox-form-control" name="profile[tags][]" multiple
                ${disabled ? "disabled" : ""} ${required ? "required" : ""} tabindex="-1">
          ${options(values)}
        </select>
        <input type="hidden" data-slot="combobox-empty-form-control" name="profile[tags][]" value=""
               ${disabled || values.length > 0 ? "disabled" : ""}>
      </section>
    </form>
  `
}

function keydown(element, key) {
  const event = new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key })
  element.dispatchEvent(event)
  return event
}

function typeQuery(input, value) {
  input.value = value
  input.dispatchEvent(new Event("input", { bubbles: true }))
}

function formValues(form, name) {
  return new FormData(form).getAll(name)
}

describe("shadcn--combobox", () => {
  it("derives the single label from its canonical value and emits only for real changes", async () => {
    vi.useFakeTimers()
    const harness = await mount(comboboxFixture("single"))
    const root = document.querySelector("#single")
    const form = document.querySelector("#single-form")
    const control = root.querySelector("[data-slot='combobox-form-control']")
    const input = document.querySelector("#single-input")
    const rails = document.querySelector("#single-rails")
    const hanami = document.querySelector("#single-hanami")
    const inputEvent = vi.fn()
    const changeEvent = vi.fn()
    const eventOrder = []
    control.addEventListener("input", (event) => {
      inputEvent(event)
      eventOrder.push(event.type)
    })
    control.addEventListener("change", (event) => {
      changeEvent(event)
      eventOrder.push(event.type)
    })

    expect(input.value).toBe("Ruby on Rails")
    expect(rails.dataset.selected).toBe("true")
    expect(rails.getAttribute("aria-selected")).toBe("true")
    expect(rails.querySelector("[data-indicator]").hidden).toBe(false)
    expect(hanami.dataset.selected).toBe("false")
    expect([...root.querySelectorAll("[data-slot='combobox-item']")].every((item) => !item.hidden)).toBe(true)
    expect(formValues(form, "profile[framework]")).toEqual(["rails"])

    hanami.click()
    expect(formValues(form, "profile[framework]")).toEqual(["hanami"])
    expect(input.value).toBe("Hanami")
    expect(hanami.dataset.selected).toBe("true")
    expect(inputEvent).toHaveBeenCalledTimes(1)
    expect(changeEvent).toHaveBeenCalledTimes(1)
    expect(eventOrder).toEqual(["input", "change"])
    expect(inputEvent.mock.calls[0][0].target).toBe(control)

    hanami.click()
    expect(inputEvent).toHaveBeenCalledTimes(1)
    expect(changeEvent).toHaveBeenCalledTimes(1)
    await harness.disconnect(root)
  })

  it("keeps a non-empty query separate from the committed value and clears only on an empty query", async () => {
    vi.useFakeTimers()
    const harness = await mount(comboboxFixture("query"))
    const root = document.querySelector("#query")
    const form = document.querySelector("#query-form")
    const input = document.querySelector("#query-input")
    const trigger = document.querySelector("#query-trigger")
    const list = document.querySelector("#query-list")

    trigger.click()
    expect(document.activeElement).toBe(input)
    input.dispatchEvent(new Event("pointerdown", { bubbles: true }))
    input.click()
    expect(list.matches(":popover-open")).toBe(true)

    typeQuery(input, "zzz")
    const unmatchedEnter = keydown(input, "Enter")
    expect(unmatchedEnter.defaultPrevented).toBe(true)
    expect(formValues(form, "profile[framework]")).toEqual(["rails"])
    expect(list.hasAttribute("data-empty")).toBe(true)

    input.value = "Hana"
    input.dispatchEvent(new Event("input", { bubbles: true }))
    expect(list.hasAttribute("data-empty")).toBe(false)
    expect(formValues(form, "profile[framework]")).toEqual(["rails"])
    expect(document.querySelector("#query-rails").hidden).toBe(true)
    expect(document.querySelector("#query-hanami").hidden).toBe(false)

    document.body.dispatchEvent(new Event("pointerdown", { bubbles: true }))
    expect(list.dataset.state).toBe("closed")
    expect(input.value).toBe("Ruby on Rails")

    input.value = ""
    input.dispatchEvent(new Event("input", { bubbles: true }))
    expect(formValues(form, "profile[framework]")).toEqual([""])
    expect(document.querySelector("#query-rails").dataset.selected).toBe("false")
    await harness.disconnect(root)
  })

  it("syncs option values, rendered chips, duplicates, blanks, and event counts", async () => {
    const harness = await mount(chipsFixture("tags"))
    const root = document.querySelector("#tags")
    const form = document.querySelector("#tags-form")
    const control = root.querySelector("[data-slot='combobox-form-control']")
    const input = document.querySelector("#tags-input")
    const inputEvent = vi.fn()
    const changeEvent = vi.fn()
    control.addEventListener("input", inputEvent)
    control.addEventListener("change", changeEvent)

    expect(formValues(form, "profile[tags][]")).toEqual(["rails", "hanami"])
    expect(root.querySelectorAll("[data-slot='combobox-chip']")).toHaveLength(2)

    document.querySelector("#tags-sinatra-item").click()
    expect(formValues(form, "profile[tags][]")).toEqual(["rails", "hanami", "sinatra"])
    expect(root.querySelector("[data-value='sinatra'] [data-slot='combobox-chip-label']").textContent)
      .toBe("Sinatra Framework")

    typeQuery(input, " Custom ")
    keydown(input, "Enter")
    expect(formValues(form, "profile[tags][]")).toEqual(["rails", "hanami", "sinatra", "Custom"])

    document.querySelector("#tags-sinatra-item").click()
    typeQuery(input, "sinatra")
    keydown(input, "Enter")
    typeQuery(input, "   ")
    keydown(input, "Enter")
    expect(formValues(form, "profile[tags][]")).toEqual(["rails", "hanami", "sinatra", "Custom"])
    expect(inputEvent).toHaveBeenCalledTimes(2)
    expect(changeEvent).toHaveBeenCalledTimes(2)

    root.querySelector("[data-value='hanami'] [data-slot='combobox-chip-remove']").click()
    expect(formValues(form, "profile[tags][]")).toEqual(["rails", "sinatra", "Custom"])
    expect(inputEvent).toHaveBeenCalledTimes(3)
    expect(changeEvent).toHaveBeenCalledTimes(3)

    root.querySelector("[data-value='rails'] [data-slot='combobox-chip-remove']").click()
    expect(formValues(form, "profile[tags][]")).toEqual(["sinatra", "Custom"])
    expect(root.querySelectorAll("[data-slot='combobox-chip']")).toHaveLength(2)
    expect(inputEvent).toHaveBeenCalledTimes(4)
    expect(changeEvent).toHaveBeenCalledTimes(4)
    await harness.disconnect(root)
  })

  it("uses only an open list highlight and otherwise treats Enter as free input", async () => {
    vi.useFakeTimers()
    const harness = await mount(chipsFixture("entry", { values: [] }))
    const root = document.querySelector("#entry")
    const form = document.querySelector("#entry-form")
    const control = root.querySelector("[data-slot='combobox-form-control']")
    const input = document.querySelector("#entry-input")
    const trigger = document.querySelector("#entry-trigger")
    const changeEvent = vi.fn()
    control.addEventListener("change", changeEvent)

    typeQuery(input, "   ")
    keydown(input, "Enter")
    expect(formValues(form, "profile[tags][]")).toEqual([""])
    expect(changeEvent).not.toHaveBeenCalled()

    typeQuery(input, "Hana")
    keydown(input, "Enter")
    expect(formValues(form, "profile[tags][]")).toEqual(["Hana"])

    typeQuery(input, "hana")
    trigger.click()
    expect(document.querySelector("#entry-rails-item").hidden).toBe(true)
    expect(document.querySelector("#entry-hanami-item").hidden).toBe(false)
    trigger.click()
    trigger.click()
    expect(input.value).toBe("hana")
    expect(document.querySelector("#entry-rails-item").hidden).toBe(true)
    keydown(input, "Enter")
    expect(formValues(form, "profile[tags][]")).toEqual(["Hana", "hanami"])
    await harness.disconnect(root)
  })

  it("uses native required and disabled semantics while forwarding invalid focus", async () => {
    const harness = await mount(`${chipsFixture("required", { required: true, values: [] })}${comboboxFixture("disabled", { disabled: true })}`)
    const requiredRoot = document.querySelector("#required")
    const requiredControl = requiredRoot.querySelector("[data-slot='combobox-form-control']")
    const requiredInput = document.querySelector("#required-input")
    const requiredList = document.querySelector("#required-list")
    const disabledRoot = document.querySelector("#disabled")
    const disabledForm = document.querySelector("#disabled-form")

    expect(requiredControl.checkValidity()).toBe(false)
    expect(requiredInput.getAttribute("aria-required")).toBe("true")
    expect(requiredInput.getAttribute("aria-expanded")).toBe("false")
    expect(requiredList.getAttribute("aria-multiselectable")).toBe("true")
    expect(listenerCount(requiredControl, "focus")).toBe(1)
    requiredControl.focus()
    expect(document.activeElement).toBe(requiredInput)
    typeQuery(requiredInput, "value")
    keydown(requiredInput, "Enter")
    expect(requiredControl.checkValidity()).toBe(true)

    expect(document.querySelector("#disabled-input").disabled).toBe(true)
    expect(document.querySelector("#disabled-trigger").disabled).toBe(true)
    document.querySelector("#disabled-hanami").click()
    expect(formValues(disabledForm, "profile[framework]")).toEqual([])
    await harness.disconnect(requiredRoot)
    expect(listenerCount(requiredControl, "focus")).toBe(0)
  })

  it("reconnects from the form control without events and keeps a complete chip template", async () => {
    const harness = await mount(chipsFixture("reconnect", { values: [] }))
    const root = document.querySelector("#reconnect")
    const control = root.querySelector("[data-slot='combobox-form-control']")
    const input = document.querySelector("#reconnect-input")
    const inputEvent = vi.fn()
    const changeEvent = vi.fn()
    control.addEventListener("input", inputEvent)
    control.addEventListener("change", changeEvent)

    typeQuery(input, "First")
    keydown(input, "Enter")
    await flushStimulus()
    root.querySelector("[data-value='First'] [data-slot='combobox-chip-remove']").click()
    expect(root.querySelectorAll("[data-slot='combobox-chip']")).toHaveLength(0)
    typeQuery(input, "stale query")
    inputEvent.mockClear()
    changeEvent.mockClear()

    root.remove()
    await flushStimulus()
    document.querySelector("#reconnect-form").append(root)
    await flushStimulus()
    expect(inputEvent).not.toHaveBeenCalled()
    expect(changeEvent).not.toHaveBeenCalled()
    expect(input.value).toBe("")

    typeQuery(input, "Second")
    keydown(input, "Enter")
    await flushStimulus()
    const chip = root.querySelector("[data-value='Second']")
    expect(chip.querySelector("[data-slot='combobox-chip-remove']")).not.toBeNull()
    expect(chip.hasAttribute("id")).toBe(false)
    expect(chip.querySelectorAll("[id]")).toHaveLength(0)
    chip.querySelector("[data-slot='combobox-chip-remove']").click()
    expect(root.querySelectorAll("[data-slot='combobox-chip']")).toHaveLength(0)
    await harness.disconnect(root)
  })

  it("cleans up a pending list exit on disconnect", async () => {
    vi.useFakeTimers()
    const pointerdownListenersBefore = listenerCount(document, "pointerdown")
    const harness = await mount(comboboxFixture("exit"))
    const root = document.querySelector("#exit")
    const trigger = document.querySelector("#exit-trigger")
    const list = document.querySelector("#exit-list")

    trigger.click()
    const timerCountBeforeExit = vi.getTimerCount()
    document.querySelector("#exit-hanami").click()
    expect(listenerCount(list, "animationend")).toBe(1)
    list.dispatchEvent(animationEvent("animationend", "exit"))
    expect(list.matches(":popover-open")).toBe(false)

    trigger.click()
    trigger.click()
    expect(listenerCount(root, "focusout")).toBe(1)
    expect(listenerCount(document, "pointerdown")).toBe(pointerdownListenersBefore + 1)
    root.remove()
    await flushStimulus()
    expect(listenerCount(root, "keydown")).toBe(0)
    expect(listenerCount(root, "focusout")).toBe(0)
    expect(listenerCount(document, "pointerdown")).toBe(pointerdownListenersBefore)
    expect(listenerCount(list, "toggle")).toBe(0)
    expect(listenerCount(list, "animationend")).toBe(0)
    expect(vi.getTimerCount()).toBe(timerCountBeforeExit)
    await harness.disconnect(root)
  })
})
