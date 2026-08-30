// shadcn--toggle: toggle の開閉状態(on/off)を data-state / aria-pressed で管理する。
// 状態はDOM自身に持たせ、destroy時の後始末は不要(05-stimulus-hotwire §2.3)。
// Stimulus本体はホストのものをimportmap等で解決する(本gemはバンドルしない)
import { Controller } from "@hotwired/stimulus"

/** @extends {Controller<HTMLElement>} */
export default class ToggleController extends Controller {
  connect() {
    this.element.setAttribute("aria-pressed", this.isOn ? "true" : "false")
  }

  toggle() {
    this.element.dataset.state = this.isOn ? "off" : "on"
    this.element.setAttribute("aria-pressed", String(this.isOn))
  }

  /** @returns {boolean} */
  get isOn() {
    return this.element.dataset.state === "on"
  }
}
