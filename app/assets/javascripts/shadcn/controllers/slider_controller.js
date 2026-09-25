import { Controller } from "@hotwired/stimulus"

import { ownedElements } from "@supermomonga/shadcn-view-components/aria_relationships"

const CONTROLLER = "shadcn--slider"
const DEFAULT_MIN = 0
const DEFAULT_MAX = 100

/** @extends {Controller<HTMLElement>} */
export default class SliderController extends Controller {
  connect() {
    this.sync()
  }

  // native input[type=range]を唯一の値源にする。キーボード・ポインタ操作は
  // ブラウザへ委譲し、その結果発火するinput/changeから装飾だけを同期する。
  sync() {
    const input = this.input
    if (!input) return

    const vertical = this.element.dataset.orientation === "vertical"
    const thumb = this.thumbs[0]
    if (!thumb) return

    const ratio = this.ratio(input)
    const thumbSize = vertical ? thumb.offsetHeight : thumb.offsetWidth
    const offset = Math.round((0.5 - ratio) * thumbSize * 1000) / 1000
    const position = `calc(${ratio * 100}% + ${offset}px)`

    for (const range of this.ranges) {
      range.style.width = vertical ? "" : position
      range.style.height = vertical ? position : ""
    }

    for (const thumb of this.thumbs) {
      thumb.style.left = vertical ? "50%" : position
      thumb.style.bottom = vertical ? position : ""
    }
  }

  /** @param {HTMLInputElement} input */
  ratio(input) {
    const min = this.numberOr(input.min, DEFAULT_MIN)
    const max = this.numberOr(input.max, DEFAULT_MAX)
    if (max <= min) return 0

    const value = Number.isFinite(input.valueAsNumber)
      ? input.valueAsNumber
      : this.numberOr(input.value, min)
    return Math.min(1, Math.max(0, (value - min) / (max - min)))
  }

  /** @param {string} value @param {number} fallback */
  numberOr(value, fallback) {
    if (value.trim() === "") return fallback
    const number = Number(value)
    return Number.isFinite(number) ? number : fallback
  }

  /** @returns {HTMLInputElement | null} */
  get input() {
    const input = ownedElements(
      this.element,
      "input[type='range'][data-slot='slider-input']",
      CONTROLLER,
    )[0]
    return /** @type {HTMLInputElement | null} */ (input ?? null)
  }

  /** @returns {HTMLElement[]} */
  get ranges() {
    return ownedElements(this.element, "[data-slot='slider-range']", CONTROLLER)
  }

  /** @returns {HTMLElement[]} */
  get thumbs() {
    return ownedElements(this.element, "[data-slot='slider-thumb']", CONTROLLER)
  }
}
