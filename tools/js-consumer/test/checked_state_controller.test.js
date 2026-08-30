import { describe, expect, it } from "vitest"
import { Application } from "@hotwired/stimulus"
import { register } from "@supermomonga/shadcn-view-components"

import { listenerCount } from "./support/listener_ledger.js"
import { flushStimulus, mount } from "./support/stimulus.js"

const IDENTIFIER = "shadcn--checked-state"

function stateAttributes(state) {
  if (state === "checked") return " data-checked"
  if (state === "unchecked") return " data-unchecked"
  if (state === "both") return " data-checked data-unchecked"
  return ""
}

function control({
  ariaChecked,
  checked = false,
  form,
  id,
  name,
  slot = "checkbox",
  staleState,
  type = "checkbox",
  value,
} = {}) {
  return `<input id="${id}" type="${type}" data-slot="${slot}"
    data-controller="${IDENTIFIER}" data-action="change->${IDENTIFIER}#sync"
    ${checked ? "checked" : ""}${name === undefined ? "" : ` name="${name}"`}
    ${form ? ` form="${form}"` : ""}${value ? ` value="${value}"` : ""}
    ${ariaChecked === undefined ? "" : ` aria-checked="${ariaChecked}"`}${stateAttributes(staleState)}>`
}

function switchControl({ checked = false, id = "switch", staleState } = {}) {
  return `<span id="${id}-wrapper">
    ${control({ checked, id, slot: "switch", staleState })}
    <span id="${id}-thumb" data-slot="switch-thumb"${stateAttributes(staleState)}></span>
  </span>`
}

function dispatchChange(input) {
  input.dispatchEvent(new Event("change", { bubbles: true }))
}

async function nextAnimationFrame() {
  await new Promise((resolve) => requestAnimationFrame(resolve))
}

function expectState(element, checked) {
  expect(element.hasAttribute("data-checked")).toBe(checked)
  expect(element.hasAttribute("data-unchecked")).toBe(!checked)
}

describe("shadcn--checked-state", () => {
  it("uses the live checked property on connect without changing checked/defaultChecked", async () => {
    await mount(control({ checked: true, id: "stale", staleState: "both" }))
    const input = document.querySelector("#stale")

    expect(input.checked).toBe(true)
    expect(input.defaultChecked).toBe(true)
    expect(input.hasAttribute("checked")).toBe(true)
    expectState(input, true)
  })

  it.each([
    { id: "checkbox", slot: "checkbox", type: "checkbox" },
    { id: "radio", name: "single", slot: "radio-group-item", type: "radio" },
    { id: "switch", slot: "switch", type: "checkbox" },
  ])("synchronizes $slot from bubbling change events", async ({ id, name, slot, type }) => {
    await mount(control({ id, name, slot, staleState: "checked", type }))
    const input = document.querySelector(`#${id}`)

    expectState(input, false)
    input.checked = true
    dispatchChange(input)
    expectState(input, true)
    input.checked = false
    dispatchChange(input)
    expectState(input, false)
  })

  it("mirrors state only to an immediately following switch thumb", async () => {
    await mount(`
      ${switchControl({ checked: true, id: "direct", staleState: "unchecked" })}
      <span id="separated-wrapper">
        ${control({ checked: true, id: "separated", slot: "switch", staleState: "unchecked" })}
        <span></span>
        <span id="separated-thumb" data-slot="switch-thumb" data-unchecked></span>
      </span>
    `)
    const input = document.querySelector("#direct")
    const directThumb = document.querySelector("#direct-thumb")
    const separatedThumb = document.querySelector("#separated-thumb")

    expectState(input, true)
    expectState(directThumb, true)
    expectState(separatedThumb, false)

    input.checked = false
    dispatchChange(input)
    expectState(input, false)
    expectState(directThumb, false)
    expectState(separatedThumb, false)
  })

  it("synchronizes every component radio in the same native group", async () => {
    await mount(`
      <form id="plans">
        ${control({ checked: true, id: "free", name: "plan", slot: "radio-group-item", type: "radio", value: "free" })}
        ${control({ id: "pro", name: "plan", slot: "radio-group-item", staleState: "checked", type: "radio", value: "pro" })}
        ${control({ id: "team", name: "plan", slot: "radio-group-item", staleState: "checked", type: "radio", value: "team" })}
      </form>
    `)
    const free = document.querySelector("#free")
    const pro = document.querySelector("#pro")
    const team = document.querySelector("#team")

    expectState(free, true)
    expectState(pro, false)
    expectState(team, false)

    pro.checked = true
    dispatchChange(pro)
    expect(free.checked).toBe(false)
    expect(pro.checked).toBe(true)
    expect(team.checked).toBe(false)
    expectState(free, false)
    expectState(pro, true)
    expectState(team, false)
  })

  it("resynchronizes a component item when a plain radio in the same native group changes", async () => {
    await mount(`
      <form id="mixed-form">
        ${control({ checked: true, id: "component-radio", name: "mixed", slot: "radio-group-item", type: "radio" })}
        <input id="plain-radio" type="radio" name="mixed">
      </form>
    `)
    const component = document.querySelector("#component-radio")
    const plain = document.querySelector("#plain-radio")

    plain.checked = true
    dispatchChange(plain)

    expect(component.checked).toBe(false)
    expectState(component, false)
    expect(plain.hasAttribute("data-checked")).toBe(false)
    expect(plain.hasAttribute("data-unchecked")).toBe(false)
  })

  it.each([
    {
      componentForm: "component-owner",
      componentName: "shared",
      plainForm: "plain-owner",
      plainName: "shared",
      title: "different form owners",
    },
    {
      componentForm: "shared-owner",
      componentName: "component-name",
      plainForm: "shared-owner",
      plainName: "plain-name",
      title: "different names",
    },
  ])("ignores a plain radio with $title", async ({ componentForm, componentName, plainForm, plainName }) => {
    const formIds = [...new Set([componentForm, plainForm])]
    await mount(`
      ${formIds.map((id) => `<form id="${id}"></form>`).join("")}
      ${control({ checked: true, form: componentForm, id: "filtered-component", name: componentName,
        slot: "radio-group-item", type: "radio" })}
      <input id="filtered-plain" type="radio" name="${plainName}" form="${plainForm}">
    `)
    const component = document.querySelector("#filtered-component")
    const plain = document.querySelector("#filtered-plain")

    plain.checked = true
    component.toggleAttribute("data-checked", !component.checked)
    component.toggleAttribute("data-unchecked", component.checked)
    dispatchChange(plain)

    expectState(component, !component.checked)
  })

  it("keeps radio change observation inside the controller's DOM tree", async () => {
    await mount(`<input id="document-radio" type="radio" name="tree-choice">`)
    const plain = document.querySelector("#document-radio")
    const host = document.createElement("div")
    const shadow = host.attachShadow({ mode: "open" })
    shadow.innerHTML = control({ checked: true, id: "shadow-radio", name: "tree-choice",
      slot: "radio-group-item", type: "radio" })
    document.body.append(host)
    const application = Application.start(shadow.querySelector("#shadow-radio"))
    register(application)
    await flushStimulus()
    const component = shadow.querySelector("#shadow-radio")

    try {
      component.removeAttribute("data-checked")
      component.setAttribute("data-unchecked", "")
      plain.checked = true
      dispatchChange(plain)

      expect(component.checked).toBe(true)
      expectState(component, false)
    } finally {
      application.stop()
      host.remove()
    }
  })

  it("does not cross form-owner boundaries for equal radio names", async () => {
    await mount(`
      <form id="first-form">
        ${control({ checked: true, id: "first", name: "choice", slot: "radio-group-item", type: "radio" })}
      </form>
      <form id="second-form">
        ${control({ id: "second", name: "choice", slot: "radio-group-item", type: "radio" })}
      </form>
    `)
    const first = document.querySelector("#first")
    const second = document.querySelector("#second")

    second.checked = true
    dispatchChange(second)
    expect(first.checked).toBe(true)
    expect(second.checked).toBe(true)
    expectState(first, true)
    expectState(second, true)
  })

  it("groups same-name radios without a form when they share a tree", async () => {
    await mount(`
      ${control({ checked: true, id: "loose-one", name: "loose", slot: "radio-group-item", type: "radio" })}
      ${control({ id: "loose-two", name: "loose", slot: "radio-group-item", type: "radio" })}
    `)
    const first = document.querySelector("#loose-one")
    const second = document.querySelector("#loose-two")

    second.checked = true
    dispatchChange(second)
    expect(first.checked).toBe(false)
    expectState(first, false)
    expectState(second, true)
  })

  it("treats empty radio names as independent controls", async () => {
    await mount(`
      ${control({ checked: true, id: "empty-one", slot: "radio-group-item", type: "radio" })}
      ${control({ id: "empty-two", slot: "radio-group-item", type: "radio" })}
    `)
    const first = document.querySelector("#empty-one")
    const second = document.querySelector("#empty-two")

    second.checked = true
    dispatchChange(second)
    expect(first.checked).toBe(true)
    expect(second.checked).toBe(true)
    expectState(first, true)
    expectState(second, true)
  })

  it("handles radio names containing CSS selector punctuation without interpolation", async () => {
    const name = "plan:pro[2026].primary"
    await mount(`
      <form>
        ${control({ checked: true, id: "special-one", name, slot: "radio-group-item", type: "radio" })}
        ${control({ id: "special-two", name, slot: "radio-group-item", type: "radio" })}
      </form>
    `)
    const first = document.querySelector("#special-one")
    const second = document.querySelector("#special-two")

    second.checked = true
    dispatchChange(second)
    expectState(first, false)
    expectState(second, true)
  })

  it("includes controls associated to an external form through form.elements", async () => {
    await mount(`
      <form id="external-owner"></form>
      ${control({ checked: true, form: "external-owner", id: "external-one", name: "external", slot: "radio-group-item", type: "radio" })}
      ${control({ form: "external-owner", id: "external-two", name: "external", slot: "radio-group-item", type: "radio" })}
    `)
    const form = document.querySelector("#external-owner")
    const first = document.querySelector("#external-one")
    const second = document.querySelector("#external-two")

    expect([...form.elements]).toContain(first)
    expect([...form.elements]).toContain(second)
    second.checked = true
    dispatchChange(second)
    expectState(first, false)
    expectState(second, true)
  })

  it("reads restored properties after the form reset default action", async () => {
    await mount(`
      <form id="reset-form">
        ${control({ checked: true, id: "reset-checkbox" })}
        ${switchControl({ id: "reset-switch" })}
        ${control({ checked: true, id: "reset-first", name: "reset-plan", slot: "radio-group-item", type: "radio" })}
        ${control({ id: "reset-second", name: "reset-plan", slot: "radio-group-item", type: "radio" })}
      </form>
    `)
    const form = document.querySelector("#reset-form")
    const checkbox = document.querySelector("#reset-checkbox")
    const switchInput = document.querySelector("#reset-switch")
    const switchThumb = document.querySelector("#reset-switch-thumb")
    const first = document.querySelector("#reset-first")
    const second = document.querySelector("#reset-second")

    checkbox.checked = false
    dispatchChange(checkbox)
    switchInput.checked = true
    dispatchChange(switchInput)
    second.checked = true
    dispatchChange(second)

    form.reset()
    await nextAnimationFrame()

    expect(checkbox.checked).toBe(true)
    expect(switchInput.checked).toBe(false)
    expect(first.checked).toBe(true)
    expect(second.checked).toBe(false)
    expectState(checkbox, true)
    expectState(switchInput, false)
    expectState(switchThumb, false)
    expectState(first, true)
    expectState(second, false)
  })

  it("keeps native and mirrored state unchanged when reset is canceled", async () => {
    await mount(`
      <form id="canceled-form">
        ${control({ checked: true, id: "canceled" })}
      </form>
    `)
    const form = document.querySelector("#canceled-form")
    const input = document.querySelector("#canceled")
    input.checked = false
    dispatchChange(input)
    form.addEventListener("reset", (event) => event.preventDefault(), { once: true })

    form.reset()
    await nextAnimationFrame()

    expect(input.checked).toBe(false)
    expectState(input, false)
  })

  it("defines bubbling change as the synchronization boundary for programmatic writes", async () => {
    await mount(control({ id: "programmatic" }))
    const input = document.querySelector("#programmatic")

    input.checked = true
    expectState(input, false)

    dispatchChange(input)
    expectState(input, true)
  })

  it("updates aria-checked only when the author supplied that attribute", async () => {
    await mount(`
      ${control({ ariaChecked: "false", checked: true, id: "explicit-aria" })}
      ${control({ checked: true, id: "implicit-aria" })}
    `)
    const explicit = document.querySelector("#explicit-aria")
    const implicit = document.querySelector("#implicit-aria")

    expect(explicit.getAttribute("aria-checked")).toBe("true")
    expect(implicit.hasAttribute("aria-checked")).toBe(false)

    explicit.checked = false
    implicit.checked = false
    dispatchChange(explicit)
    dispatchChange(implicit)
    expect(explicit.getAttribute("aria-checked")).toBe("false")
    expect(implicit.hasAttribute("aria-checked")).toBe(false)
  })

  it("cleans the form listener and restores from the live property on reconnect", async () => {
    const harness = await mount(`
      <form id="reconnect-form">
        ${control({ id: "reconnect" })}
      </form>
    `)
    const form = document.querySelector("#reconnect-form")
    const input = document.querySelector("#reconnect")

    expect(listenerCount(form, "reset")).toBe(1)
    input.remove()
    await flushStimulus()
    expect(listenerCount(form, "reset")).toBe(0)

    input.checked = true
    form.append(input)
    await flushStimulus()
    expect(listenerCount(form, "reset")).toBe(1)
    expect(input.defaultChecked).toBe(false)
    expect(input.hasAttribute("checked")).toBe(false)
    expectState(input, true)

    await harness.disconnect(form)
    expect(listenerCount(form, "reset")).toBe(0)
  })

  it("removes its DOM-tree radio change listener on disconnect", async () => {
    const changeListeners = listenerCount(document, "change")
    await mount(control({ id: "listener-radio", name: "listener", slot: "radio-group-item", type: "radio" }))
    const input = document.querySelector("#listener-radio")

    expect(listenerCount(document, "change")).toBe(changeListeners + 1)
    input.remove()
    await flushStimulus()
    expect(listenerCount(document, "change")).toBe(changeListeners)
  })

  it("does not let a queued reset callback mutate a disconnected input", async () => {
    await mount(`
      <form id="queued-form">
        ${control({ checked: true, id: "queued" })}
      </form>
    `)
    const form = document.querySelector("#queued-form")
    const input = document.querySelector("#queued")
    input.checked = false
    dispatchChange(input)
    expectState(input, false)

    form.reset()
    input.remove()
    await flushStimulus()
    await nextAnimationFrame()

    expect(input.checked).toBe(true)
    expectState(input, false)
    expect(listenerCount(form, "reset")).toBe(0)
  })
})
