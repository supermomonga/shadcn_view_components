import { describe, expect, it, vi } from "vitest"

import { listenerCount } from "./support/listener_ledger.js"
import { flushStimulus, mount } from "./support/stimulus.js"

const ACTIONS = [
  "input->shadcn--input-otp#sync",
  "change->shadcn--input-otp#sync",
  "focus->shadcn--input-otp#sync",
  "blur->shadcn--input-otp#sync",
  "select->shadcn--input-otp#sync",
  "invalid->shadcn--input-otp#sync",
  "compositionstart->shadcn--input-otp#compositionStart",
  "compositionend->shadcn--input-otp#compositionEnd",
].join(" ")

function otpRoot({
  disabled = false,
  id,
  invalid = false,
  length = 6,
  nested = "",
  pattern,
  value = "",
}) {
  const slots = Array.from({ length }, (_, index) => `
    <div data-slot="input-otp-slot" data-index="${index}" data-active="false">
      <span data-slot="input-otp-character"></span>
      <span data-slot="input-otp-caret" hidden></span>
    </div>
  `).join("")

  return `
    <div id="${id}" data-controller="shadcn--input-otp" data-input-otp-container>
      <div data-input-otp-display>${slots}${nested}</div>
      <input type="text" data-slot="input-otp" maxlength="${length}"
             value="${value}" ${pattern === undefined ? "" : `pattern="${pattern}"`}
             ${disabled ? "disabled" : ""} aria-invalid="${invalid}"
             data-action="${ACTIONS}">
    </div>
  `
}

function fixture(options) {
  return `<form id="${options.id}-form">${otpRoot(options)}</form>`
}

function elements(id) {
  const root = document.querySelector(`#${id}`)
  const input = root.querySelector(":scope > input[data-slot='input-otp']")
  const display = root.querySelector(":scope > [data-input-otp-display]")
  const slots = [...root.querySelectorAll(":scope > [data-input-otp-display] > [data-slot='input-otp-slot']")]
  return { display, input, root, slots }
}

function characters(slots) {
  return slots.map((slot) => slot.querySelector("[data-slot='input-otp-character']").textContent)
}

function dispatchInput(input, { isComposing = false, inputType = "insertText", type = "input" } = {}) {
  const event = new Event(type, { bubbles: true })
  Object.defineProperties(event, {
    inputType: { value: inputType },
    isComposing: { value: isComposing },
  })
  input.dispatchEvent(event)
}

function dispatchComposition(input, type) {
  input.dispatchEvent(new Event(type, { bubbles: true }))
}

function clipboardEvent(content) {
  const event = new Event("paste", { bubbles: true, cancelable: true })
  Object.defineProperty(event, "clipboardData", {
    value: { getData: (type) => type === "text/plain" ? content : "" },
  })
  return event
}

function select(input, start, end = start, direction = "none") {
  input.setSelectionRange(start, end, direction)
  document.dispatchEvent(new Event("selectionchange"))
}

describe("shadcn--input-otp", () => {
  it("caps the initial DOM baseline at maxlength without applying pattern", async () => {
    await mount(fixture({ id: "initial", length: 4, pattern: "^\\d+$", value: "A-123" }))
    const { input, slots } = elements("initial")

    expect(input.value).toBe("A-12")
    expect(characters(slots)).toEqual(["A", "-", "1", "2"])
    expect(slots.every((slot) => slot.dataset.active === "false")).toBe(true)
  })

  it("synchronizes input, deletion, paste-shaped input, autofill change, and maxlength", async () => {
    await mount(fixture({ id: "updates", value: "1234" }))
    const { input, slots } = elements("updates")

    input.value = "12"
    input.setSelectionRange(2, 2)
    dispatchInput(input, { inputType: "deleteContentBackward" })
    expect(characters(slots)).toEqual(["1", "2", "", "", "", ""])

    const desktopPaste = clipboardEvent("9")
    input.dispatchEvent(desktopPaste)
    expect(desktopPaste.defaultPrevented).toBe(false)
    expect(input.value).toBe("12")

    select(input, 1, 2)
    input.value = "195"
    input.setSelectionRange(2, 2)
    dispatchInput(input, { inputType: "insertFromPaste" })
    expect(input.value).toBe("195")
    expect(characters(slots)).toEqual(["1", "9", "5", "", "", ""])

    input.value = "654321"
    input.setSelectionRange(6, 6)
    dispatchInput(input, { type: "change" })
    expect(characters(slots)).toEqual(["6", "5", "4", "3", "2", "1"])

    input.value = "1234567"
    input.setSelectionRange(7, 7)
    dispatchInput(input)
    expect(input.value).toBe("123456")
    expect(input.selectionStart).toBe(6)
    expect(characters(slots)).toEqual(["1", "2", "3", "4", "5", "6"])
  })

  it("rejects the whole changed value on pattern mismatch and restores its selection", async () => {
    await mount(fixture({ id: "pattern", pattern: "^\\d+$", value: "12" }))
    const { input, slots } = elements("pattern")
    const observed = vi.fn()
    input.addEventListener("input", observed)

    input.focus()
    select(input, 1, 2, "backward")
    input.value = "1A"
    input.setSelectionRange(2, 2)
    dispatchInput(input, { inputType: "insertFromPaste" })

    expect(input.value).toBe("12")
    expect(input.selectionStart).toBe(1)
    expect(input.selectionEnd).toBe(2)
    expect(input.selectionDirection).toBe("backward")
    expect(characters(slots)).toEqual(["1", "2", "", "", "", ""])
    expect(observed).toHaveBeenCalledOnce()

    input.value = ""
    input.setSelectionRange(0, 0)
    dispatchInput(input, { inputType: "deleteContentBackward" })
    expect(input.value).toBe("")
  })

  it("does not constrain values when pattern is omitted", async () => {
    await mount(fixture({ id: "unrestricted", value: "A-1" }))
    const { input, slots } = elements("unrestricted")

    input.value = "B_2!"
    input.setSelectionRange(4, 4)
    dispatchInput(input)

    expect(input.value).toBe("B_2!")
    expect(characters(slots)).toEqual(["B", "_", "2", "!", "", ""])
  })

  it("uses the caller's RegExp as-is instead of adding implicit anchors", async () => {
    await mount(fixture({ id: "regexp", pattern: "[0-9]+", value: "1" }))
    const { input, slots } = elements("regexp")

    input.value = "A1"
    input.setSelectionRange(2, 2)
    dispatchInput(input)

    expect(input.value).toBe("A1")
    expect(characters(slots)).toEqual(["A", "1", "", "", "", ""])
  })

  it("defers pattern validation during composition and validates the committed value", async () => {
    await mount(fixture({ id: "ime", pattern: "^\\d+$", value: "12" }))
    const { input, slots } = elements("ime")

    input.focus()
    select(input, 2)
    dispatchComposition(input, "compositionstart")
    input.value = "12あ"
    input.setSelectionRange(3, 3)
    dispatchInput(input, { isComposing: true, inputType: "insertCompositionText" })
    expect(input.value).toBe("12あ")
    expect(characters(slots)).toEqual(["1", "2", "", "", "", ""])

    dispatchComposition(input, "compositionend")
    expect(input.value).toBe("12")
    expect(input.selectionStart).toBe(2)
    expect(characters(slots)).toEqual(["1", "2", "", "", "", ""])

    dispatchComposition(input, "compositionstart")
    input.value = "123"
    input.setSelectionRange(3, 3)
    dispatchComposition(input, "compositionend")
    expect(input.value).toBe("123")
    expect(characters(slots)).toEqual(["1", "2", "3", "", "", ""])
  })

  it("implements the upstream iOS paste replacement without changing desktop paste", async () => {
    const cssDescriptor = Object.getOwnPropertyDescriptor(window, "CSS")
    Object.defineProperty(window, "CSS", {
      configurable: true,
      value: { supports: (query) => query === "-webkit-touch-callout" },
    })

    try {
      const harness = await mount(fixture({ id: "ios-paste", pattern: "^\\d+$", value: "1234" }))
      const { input, root, slots } = elements("ios-paste")
      const observedInput = vi.fn()
      input.addEventListener("input", observedInput)

      input.focus()
      select(input, 1, 3)
      const acceptedPaste = clipboardEvent("9")
      input.dispatchEvent(acceptedPaste)

      expect(acceptedPaste.defaultPrevented).toBe(true)
      expect(input.value).toBe("194")
      expect(input.selectionStart).toBe(3)
      expect(input.selectionEnd).toBe(3)
      expect(characters(slots)).toEqual(["1", "9", "4", "", "", ""])
      expect(listenerCount(input, "paste")).toBe(1)
      expect(observedInput).toHaveBeenCalledOnce()
      expect(observedInput.mock.calls[0][0]).toMatchObject({
        bubbles: true,
        composed: true,
        data: "9",
        inputType: "insertFromPaste",
      })

      select(input, 1, 2)
      const rejectedPaste = clipboardEvent("A")
      input.dispatchEvent(rejectedPaste)
      expect(rejectedPaste.defaultPrevented).toBe(true)
      expect(input.value).toBe("194")
      expect(input.selectionStart).toBe(1)
      expect(input.selectionEnd).toBe(2)
      expect(observedInput).toHaveBeenCalledOnce()

      await harness.disconnect(root)
      expect(listenerCount(input, "paste")).toBe(0)
    } finally {
      if (cssDescriptor) Object.defineProperty(window, "CSS", cssDescriptor)
      else delete window.CSS
    }
  })

  it("derives active slots and the fake caret from the native selection", async () => {
    await mount(fixture({ id: "selection", value: "12" }))
    const { input, slots } = elements("selection")
    const caret = (index) => slots[index].querySelector("[data-slot='input-otp-caret']")

    input.focus()
    select(input, 2)
    expect(slots.map((slot) => slot.dataset.active)).toEqual(["false", "false", "true", "false", "false", "false"])
    expect(caret(2).hidden).toBe(false)

    select(input, 0, 2, "forward")
    expect(slots.map((slot) => slot.dataset.active)).toEqual(["true", "true", "false", "false", "false", "false"])
    expect(slots.every((_, index) => caret(index).hidden)).toBe(true)

    input.value = "123456"
    input.setSelectionRange(6, 6)
    dispatchInput(input)
    document.dispatchEvent(new Event("selectionchange"))
    expect(slots[5].dataset.active).toBe("true")
    expect(caret(5).hidden).toBe(true)
    expect(input.selectionStart).toBe(5)
    expect(input.selectionEnd).toBe(6)
    expect(input.selectionDirection).toBe("backward")

    input.setRangeText("9", input.selectionStart, input.selectionEnd, "end")
    dispatchInput(input)
    expect(input.value).toBe("123459")
    expect(characters(slots)).toEqual(["1", "2", "3", "4", "5", "9"])

    input.blur()
    expect(slots.every((slot) => slot.dataset.active === "false")).toBe(true)
  })

  it("normalizes focus and collapsed navigation to an editable character range", async () => {
    await mount(fixture({ id: "navigation", value: "1234" }))
    const { input, slots } = elements("navigation")

    input.focus()
    expect(input.selectionStart).toBe(4)
    expect(input.selectionEnd).toBe(4)
    expect(slots[4].dataset.active).toBe("true")

    select(input, 2)
    expect(input.selectionStart).toBe(2)
    expect(input.selectionEnd).toBe(3)
    expect(input.selectionDirection).toBe("backward")
    expect(slots[2].dataset.active).toBe("true")

    select(input, 2)
    expect(input.selectionStart).toBe(1)
    expect(input.selectionEnd).toBe(2)
    expect(input.selectionDirection).toBe("backward")
    expect(slots[1].dataset.active).toBe("true")

    select(input, 2)
    expect(input.selectionStart).toBe(2)
    expect(input.selectionEnd).toBe(3)
    expect(input.selectionDirection).toBe("forward")
    expect(slots[2].dataset.active).toBe("true")
  })

  it("reflects disabled and explicit aria-invalid state without activating a slot", async () => {
    await mount(fixture({ disabled: true, id: "state", invalid: true, value: "1" }))
    const { display, input, slots } = elements("state")

    expect(display.hasAttribute("data-disabled")).toBe(true)
    expect(display.hasAttribute("data-invalid")).toBe(true)
    expect(slots.every((slot) => slot.hasAttribute("data-disabled"))).toBe(true)
    expect(slots.every((slot) => slot.getAttribute("aria-invalid") === "true")).toBe(true)
    expect(slots.every((slot) => slot.dataset.active === "false")).toBe(true)

    input.disabled = false
    input.setAttribute("aria-invalid", "false")
    dispatchInput(input, { type: "change" })
    expect(display.hasAttribute("data-disabled")).toBe(false)
    expect(display.hasAttribute("data-invalid")).toBe(false)
    expect(slots.every((slot) => slot.getAttribute("aria-invalid") === "false")).toBe(true)
  })

  it("injects the upstream input masking styles only once", async () => {
    document.querySelector("#input-otp-style")?.remove()

    await mount(
      fixture({ id: "styles-first" }) + fixture({ id: "styles-second" }),
    )

    const styles = [...document.querySelectorAll("#input-otp-style")]
    expect(styles).toHaveLength(1)

    const rules = [...styles[0].sheet.cssRules].map((rule) => rule.cssText).join("\n")
    expect(rules).toContain("[data-input-otp]::selection")
    expect(rules).toContain("[data-input-otp]:autofill")
    expect(rules).toContain("[data-input-otp]:-webkit-autofill")
    expect(rules).toContain("@supports (-webkit-touch-callout: none)")
    expect(rules).toContain("[data-input-otp] + *")
  })

  it("accepts the reset default as a new baseline", async () => {
    await mount(fixture({ id: "reset", pattern: "^\\d+$", value: "12" }))
    const { input, slots } = elements("reset")
    const form = document.querySelector("#reset-form")

    input.value = "34"
    input.setSelectionRange(2, 2)
    dispatchInput(input)
    expect(characters(slots)).toEqual(["3", "4", "", "", "", ""])

    input.defaultValue = "1234567"
    form.reset()
    await Promise.resolve()
    expect(input.value).toBe("123456")
    expect(input.selectionStart).toBe(2)
    expect(input.selectionEnd).toBe(2)
    expect(characters(slots)).toEqual(["1", "2", "3", "4", "5", "6"])
  })

  it("isolates nested roots and releases document/form listeners across reconnects", async () => {
    const selectionListeners = listenerCount(document, "selectionchange")
    const inner = otpRoot({ id: "inner", value: "89" })
    const harness = await mount(fixture({ id: "outer", nested: inner, value: "12" }))
    const outer = elements("outer")
    const innerElements = elements("inner")
    const form = document.querySelector("#outer-form")

    expect(characters(outer.slots)).toEqual(["1", "2", "", "", "", ""])
    expect(characters(innerElements.slots)).toEqual(["8", "9", "", "", "", ""])
    expect(listenerCount(document, "selectionchange")).toBe(selectionListeners + 2)

    innerElements.input.value = "87"
    innerElements.input.setSelectionRange(2, 2)
    dispatchInput(innerElements.input)
    expect(characters(innerElements.slots)).toEqual(["8", "7", "", "", "", ""])
    expect(characters(outer.slots)).toEqual(["1", "2", "", "", "", ""])

    const controller = harness.controller(outer.root, "shadcn--input-otp")
    outer.root.remove()
    await flushStimulus()
    expect(listenerCount(document, "selectionchange")).toBe(selectionListeners)

    outer.input.value = "5678912"
    outer.input.setSelectionRange(7, 7)
    form.append(outer.root)
    await flushStimulus()
    expect(harness.controller(outer.root, "shadcn--input-otp")).toBe(controller)
    expect(outer.input.value).toBe("567891")
    expect(outer.input.selectionStart).toBe(6)
    expect(outer.input.selectionEnd).toBe(6)
    expect(characters(outer.slots)).toEqual(["5", "6", "7", "8", "9", "1"])
    expect(listenerCount(document, "selectionchange")).toBe(selectionListeners + 2)

    await harness.disconnect(form)
    expect(listenerCount(document, "selectionchange")).toBe(selectionListeners)
  })
})
