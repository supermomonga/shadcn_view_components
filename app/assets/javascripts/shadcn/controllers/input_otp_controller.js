import { Controller } from "@hotwired/stimulus"

import { ownedElements } from "@supermomonga/shadcn-view-components/aria_relationships"

const IDENTIFIER = "shadcn--input-otp"
const STYLE_ID = "input-otp-style"
const AUTOFILL_STYLES = "background: transparent !important; color: transparent !important; " +
  "border-color: transparent !important; opacity: 0 !important; box-shadow: none !important; " +
  "-webkit-box-shadow: none !important; -webkit-text-fill-color: transparent !important;"
const STYLE_RULES = [
  "[data-input-otp]::selection { background: transparent !important; color: transparent !important; }",
  `[data-input-otp]:autofill { ${AUTOFILL_STYLES} }`,
  `[data-input-otp]:-webkit-autofill { ${AUTOFILL_STYLES} }`,
  "@supports (-webkit-touch-callout: none) { [data-input-otp] { letter-spacing: -.6em !important; " +
    "font-weight: 100 !important; font-stretch: ultra-condensed; font-optical-sizing: none !important; " +
    "left: -1px !important; right: 1px !important; } }",
  "[data-input-otp] + * { pointer-events: all !important; }",
]

function ensureRuntimeStyles() {
  if (document.getElementById(STYLE_ID)) return

  const style = document.createElement("style")
  style.id = STYLE_ID
  document.head.appendChild(style)
  if (!style.sheet) return

  for (const rule of STYLE_RULES) safeInsertRule(style.sheet, rule)
}

/** @param {CSSStyleSheet} sheet @param {string} rule */
function safeInsertRule(sheet, rule) {
  try {
    sheet.insertRule(rule)
  } catch {
    globalThis.console.error("input-otp could not insert CSS rule:", rule)
  }
}

/** @extends {Controller<HTMLElement>} */
export default class InputOTPController extends Controller {
  /** @type {HTMLInputElement | null} */
  input = null

  /** @type {HTMLElement | null} */
  display = null

  /** @type {HTMLFormElement | null} */
  form = null

  /** @type {HTMLElement[]} */
  slots = []

  /** @type {RegExp | null} */
  pattern = null

  /** @type {boolean} */
  composing = false

  /** @type {boolean} */
  isIOS = false

  /** @type {string} */
  acceptedValue = ""

  /** @type {number} */
  acceptedSelectionStart = 0

  /** @type {number} */
  acceptedSelectionEnd = 0

  /** @type {"forward" | "backward" | "none"} */
  acceptedSelectionDirection = "none"

  /** @type {number | null} */
  previousSelectionStart = null

  /** @type {number | null} */
  previousSelectionEnd = null

  /** @type {"forward" | "backward" | "none" | null} */
  previousSelectionDirection = null

  /** @type {() => void} */
  onSelectionChange = () => {
    if (this.composing) return
    this.normalizeSelection()
  }

  /** @type {(event: ClipboardEvent) => void} */
  onPaste = (event) => this.paste(event)

  /** @type {() => void} */
  onFormReset = () => {
    const input = this.input
    window.queueMicrotask(() => {
      if (!input || this.input !== input || !this.element.isConnected) return

      // reset後のdefaultValueは初期値と同じくpattern検証を経ないbaselineにする。
      this.acceptBaseline()
      this.syncPresentation()
    })
  }

  connect() {
    this.input = /** @type {HTMLInputElement | null} */ (
      ownedElements(this.element, "input[data-slot='input-otp']", IDENTIFIER)[0] ?? null
    )
    this.display = ownedElements(this.element, "[data-input-otp-display]", IDENTIFIER)[0] ?? null
    this.slots = ownedElements(
      this.element,
      "[data-slot='input-otp-slot'][data-index]",
      IDENTIFIER,
    )
    this.form = this.input?.form ?? null
    this.composing = false
    this.isIOS = Boolean(window.CSS?.supports?.("-webkit-touch-callout", "none"))

    if (!this.input) return

    // input-otp 1.4.2と同じく、patternは利用者が完全一致を含めて指定する。
    // 空patternは制限なしとして扱い、不正な正規表現は接続時にfail-fastする。
    this.pattern = this.input.pattern ? new RegExp(this.input.pattern) : null
    ensureRuntimeStyles()
    this.acceptBaseline()
    this.syncPresentation()

    document.addEventListener("selectionchange", this.onSelectionChange, true)
    this.form?.addEventListener("reset", this.onFormReset)
    this.input.addEventListener("paste", this.onPaste)
  }

  disconnect() {
    document.removeEventListener("selectionchange", this.onSelectionChange, true)
    this.form?.removeEventListener("reset", this.onFormReset)
    this.input?.removeEventListener("paste", this.onPaste)
    this.clearActivePresentation()

    this.input = null
    this.display = null
    this.form = null
    this.slots = []
    this.pattern = null
    this.composing = false
    this.isIOS = false
    this.previousSelectionStart = null
    this.previousSelectionEnd = null
    this.previousSelectionDirection = null
  }

  /** @param {Event} [event] */
  sync(event) {
    const inputEvent = /** @type {InputEvent | undefined} */ (event)
    if (!this.input || this.composing || inputEvent?.isComposing) return

    if (event?.type === "focus") this.normalizeFocusSelection()
    if (!event || event.type === "input" || event.type === "change") this.acceptOrRestoreValue()
    this.syncPresentation()
  }

  compositionStart() {
    this.composing = true
  }

  compositionEnd() {
    if (!this.input) return

    this.composing = false
    this.acceptOrRestoreValue()
    this.syncPresentation()
  }

  acceptBaseline() {
    if (!this.input) return

    const baseline = this.truncate(this.input.value)
    const selection = this.selectionWithin(baseline.length)
    if (baseline !== this.input.value) this.input.value = baseline
    this.applySelection(selection)
    this.acceptedValue = baseline
    this.captureAcceptedSelection()
    this.capturePreviousSelection()
  }

  acceptOrRestoreValue() {
    const input = this.input
    if (!input) return

    const previousLength = this.acceptedValue.length
    const rawValue = input.value
    const candidate = this.truncate(rawValue)
    const selection = this.selectionWithin(candidate.length)
    const changed = candidate !== this.acceptedValue
    const rejected = changed && candidate !== "" && this.pattern && !this.pattern.test(candidate)

    if (rejected) {
      this.restoreAcceptedValue()
      return
    }

    if (candidate !== rawValue) input.value = candidate
    this.applySelection(selection)
    this.acceptedValue = candidate
    this.captureAcceptedSelection()
    if (candidate.length < previousLength) document.dispatchEvent(new window.Event("selectionchange"))
  }

  normalizeFocusSelection() {
    const input = this.input
    if (!input) return

    const start = Math.min(input.value.length, Math.max(0, this.maximumLength - 1))
    input.setSelectionRange(start, input.value.length)
    this.capturePreviousSelection()
  }

  normalizeSelection() {
    const input = this.input
    if (!input) return
    if (document.activeElement !== input) {
      this.syncPresentation()
      return
    }

    const selectionStart = input.selectionStart
    const selectionEnd = input.selectionEnd
    const maximum = this.maximumLength
    const value = input.value
    let normalizedStart = -1
    let normalizedEnd = -1
    /** @type {"forward" | "backward" | "none" | undefined} */
    let normalizedDirection

    if (value.length !== 0 && selectionStart !== null && selectionEnd !== null) {
      const collapsed = selectionStart === selectionEnd
      const inserting = selectionStart === value.length && value.length < maximum

      if (collapsed && !inserting) {
        const caret = selectionStart
        if (caret === 0) {
          normalizedStart = 0
          normalizedEnd = 1
          normalizedDirection = "forward"
        } else if (caret === maximum) {
          normalizedStart = caret - 1
          normalizedEnd = caret
          normalizedDirection = "backward"
        } else if (maximum > 1 && value.length > 1) {
          let offset = 0
          if (this.previousSelectionStart !== null && this.previousSelectionEnd !== null) {
            normalizedDirection = caret < this.previousSelectionEnd ? "backward" : "forward"
            const wasInserting = this.previousSelectionStart === this.previousSelectionEnd &&
              this.previousSelectionStart < maximum
            if (normalizedDirection === "backward" && !wasInserting) offset = -1
          }
          normalizedStart = offset + caret
          normalizedEnd = offset + caret + 1
        }
      }
    }

    if (normalizedStart !== -1 && normalizedEnd !== -1 && normalizedStart !== normalizedEnd) {
      input.setSelectionRange(normalizedStart, normalizedEnd, normalizedDirection)
    }
    this.capturePreviousSelection()
    this.syncPresentation()
  }

  /** @param {ClipboardEvent} event */
  paste(event) {
    const input = this.input
    if (!this.isIOS || !input || !event.clipboardData) return

    event.preventDefault()
    const content = event.clipboardData.getData("text/plain")
    const start = input.selectionStart ?? 0
    const end = input.selectionEnd ?? start
    const candidate = this.truncate(
      start !== end
        ? this.acceptedValue.slice(0, start) + content + this.acceptedValue.slice(end)
        : this.acceptedValue.slice(0, start) + content + this.acceptedValue.slice(start),
    )
    if (candidate !== "" && this.pattern && !this.pattern.test(candidate)) return

    input.value = candidate
    this.acceptedValue = candidate
    const selectionStart = Math.min(candidate.length, Math.max(0, this.maximumLength - 1))
    input.setSelectionRange(selectionStart, candidate.length)
    this.captureAcceptedSelection()
    this.capturePreviousSelection()
    this.syncPresentation()
    input.dispatchEvent(new window.InputEvent("input", {
      bubbles: true,
      composed: true,
      data: content,
      inputType: "insertFromPaste",
    }))
  }

  syncPresentation() {
    const input = this.input
    if (!input) return

    const value = input.value
    const focused = document.activeElement === input && !input.disabled
    const selectionStart = input.selectionStart ?? value.length
    const selectionEnd = input.selectionEnd ?? selectionStart
    const start = Math.min(selectionStart, selectionEnd)
    const end = Math.max(selectionStart, selectionEnd)
    const collapsed = start === end
    const length = this.maximumLength
    const activeIndex = collapsed && length > 0 ? Math.min(start, length - 1) : -1
    const invalid = input.getAttribute("aria-invalid") === "true"

    this.display?.toggleAttribute("data-disabled", input.disabled)
    this.display?.toggleAttribute("data-invalid", invalid)

    for (const slot of this.slots) {
      const index = Number(slot.dataset.index)
      const active = focused && Number.isInteger(index) && (
        collapsed ? index === activeIndex : index >= start && index < end
      )
      const caretVisible = active && collapsed && index === start && start < length && value[index] === undefined
      const character = this.part(slot, "input-otp-character")
      const caret = this.part(slot, "input-otp-caret")

      if (character) character.textContent = value[index] ?? ""
      if (caret) caret.hidden = !caretVisible
      slot.dataset.active = String(active)
      slot.toggleAttribute("data-disabled", input.disabled)
      slot.setAttribute("aria-invalid", String(invalid))
    }

    if (input.value === this.acceptedValue) this.captureAcceptedSelection()
  }

  clearActivePresentation() {
    for (const slot of this.slots) {
      slot.dataset.active = "false"
      const caret = this.part(slot, "input-otp-caret")
      if (caret) caret.hidden = true
    }
  }

  restoreAcceptedValue() {
    const input = this.input
    if (!input) return

    input.value = this.acceptedValue
    input.setSelectionRange(
      Math.min(this.acceptedSelectionStart, input.value.length),
      Math.min(this.acceptedSelectionEnd, input.value.length),
      this.acceptedSelectionDirection,
    )
  }

  captureAcceptedSelection() {
    const input = this.input
    if (!input) return

    this.acceptedSelectionStart = input.selectionStart ?? input.value.length
    this.acceptedSelectionEnd = input.selectionEnd ?? this.acceptedSelectionStart
    this.acceptedSelectionDirection = input.selectionDirection ?? "none"
  }

  capturePreviousSelection() {
    const input = this.input
    if (!input) return

    this.previousSelectionStart = input.selectionStart
    this.previousSelectionEnd = input.selectionEnd
    this.previousSelectionDirection = input.selectionDirection
  }

  /** @param {number} maximum @returns {{ start: number, end: number, direction: "forward" | "backward" | "none" }} */
  selectionWithin(maximum) {
    const input = this.input
    if (!input) return { start: 0, end: 0, direction: "none" }

    return {
      start: Math.min(input.selectionStart ?? maximum, maximum),
      end: Math.min(input.selectionEnd ?? maximum, maximum),
      direction: input.selectionDirection ?? "none",
    }
  }

  /** @param {{ start: number, end: number, direction: "forward" | "backward" | "none" }} selection */
  applySelection(selection) {
    this.input?.setSelectionRange(selection.start, selection.end, selection.direction)
  }

  /** @param {string} value @returns {string} */
  truncate(value) {
    const maximum = this.input?.maxLength ?? -1
    return maximum >= 0 ? value.slice(0, maximum) : value
  }

  /** @param {HTMLElement} slot @param {string} name @returns {HTMLElement | null} */
  part(slot, name) {
    const element = /** @type {HTMLElement | null} */ (
      slot.querySelector(`[data-slot='${name}']`)
    )
    return element?.closest(`[data-controller~='${IDENTIFIER}']`) === this.element ? element : null
  }

  /** @returns {number} */
  get maximumLength() {
    const maximum = this.input?.maxLength ?? -1
    if (maximum >= 0) return maximum

    return this.slots.reduce((length, slot) => {
      const index = Number(slot.dataset.index)
      return Number.isInteger(index) ? Math.max(length, index + 1) : length
    }, 0)
  }
}
