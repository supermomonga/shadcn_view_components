import { Controller } from "@hotwired/stimulus"

/** @param {Element} element @param {boolean} checked */
function applyDataState(element, checked) {
  element.toggleAttribute("data-checked", checked)
  element.toggleAttribute("data-unchecked", !checked)
}

/** @param {EventTarget | null} target @returns {target is HTMLInputElement} */
function isRadioInput(target) {
  return target instanceof Element && target.matches("input[type='radio']")
}

// Checkbox・RadioGroup::Item・Switch の見た目用属性を、native checked propertyから導出する。
// checked content attributeはreset用のdefaultCheckedなので、このcontrollerからは変更しない。
/** @extends {Controller<HTMLElement>} */
export default class CheckedStateController extends Controller {
  /** @type {HTMLInputElement | null} */
  input = null

  /** @type {HTMLFormElement | null} */
  form = null

  /** @type {Node | null} */
  radioTree = null

  /** @type {number | null} */
  resetFrame = null

  connectionVersion = 0

  /** @param {Event} event */
  onRadioGroupChange = (event) => {
    const input = this.input
    const changed = event.target
    if (
      !input ||
      input.type !== "radio" ||
      input.name === "" ||
      !isRadioInput(changed) ||
      changed === input ||
      changed.name !== input.name ||
      changed.form !== input.form ||
      changed.getRootNode() !== this.radioTree
    ) return

    // checkedになったradio以外はchangeを発火しないため、同じnative groupで
    // 発生したchangeを各Itemが受け取り、自分自身の現在propertyだけを反映する。
    this.applyInputState(input)
  }

  onFormReset = () => {
    const input = this.input
    const form = this.form
    const version = this.connectionVersion
    const ownerWindow = input?.ownerDocument.defaultView
    if (!input || !ownerWindow) return

    // Chromeはreset event listener中に予約したmicrotaskより後でcheckedを復元する。
    // 次の描画前に読むことで、既定reset後のpropertyを見た目へ反映する。
    if (this.resetFrame !== null) ownerWindow.cancelAnimationFrame(this.resetFrame)
    this.resetFrame = ownerWindow.requestAnimationFrame(() => {
      this.resetFrame = null
      if (
        this.connectionVersion !== version ||
        this.input !== input ||
        this.form !== form ||
        !input.isConnected
      ) return

      this.sync()
    })
  }

  connect() {
    this.connectionVersion += 1
    this.input = this.element.matches("input[type='checkbox'], input[type='radio']")
      ? /** @type {HTMLInputElement} */ (this.element)
      : null
    this.form = this.input?.form ?? null
    this.radioTree = this.input?.type === "radio" && this.input.name !== ""
      ? this.input.getRootNode()
      : null

    this.form?.addEventListener("reset", this.onFormReset)
    this.radioTree?.addEventListener("change", this.onRadioGroupChange, true)
    this.sync()
  }

  disconnect() {
    this.connectionVersion += 1
    const ownerWindow = this.input?.ownerDocument.defaultView
    if (ownerWindow && this.resetFrame !== null) ownerWindow.cancelAnimationFrame(this.resetFrame)
    this.form?.removeEventListener("reset", this.onFormReset)
    this.radioTree?.removeEventListener("change", this.onRadioGroupChange, true)
    this.input = null
    this.form = null
    this.radioTree = null
    this.resetFrame = null
  }

  // Programmaticなchecked変更はnative eventを発火しないため、利用者は変更後に
  // bubbling change eventをdispatchしてこのactionを呼ぶ。
  sync() {
    const input = this.input
    if (!input) return

    this.applyInputState(input)
  }

  /** @param {HTMLInputElement} input */
  applyInputState(input) {
    applyDataState(input, input.checked)
    if (input.hasAttribute("aria-checked")) {
      input.setAttribute("aria-checked", String(input.checked))
    }

    const mirror = input.nextElementSibling
    if (mirror?.matches("[data-slot='switch-thumb']")) applyDataState(mirror, input.checked)
  }
}
