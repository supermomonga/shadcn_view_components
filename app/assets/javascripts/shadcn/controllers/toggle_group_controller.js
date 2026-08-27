// shadcn--toggle-group: グループ内の item(data-slot="toggle-group-item")の開閉を管理する。
// type: single では常に1つのみ on(排他)。multiple では独立してトグルする。
// 状態はDOM自身(data-type / data-state)に持たせる(05-stimulus-hotwire §2.3)
import { Controller } from "@hotwired/stimulus"

export default class ToggleGroupController extends Controller {
  toggleItem(event) {
    const item = event.currentTarget
    const isOn = item.dataset.state === "on"

    if (this.isSingle && !isOn) {
      this.items.forEach((element) => this.setState(element, false))
    }
    this.setState(item, !isOn)
  }

  get isSingle() {
    return this.element.dataset.type === "single"
  }

  get items() {
    return this.element.querySelectorAll("[data-slot='toggle-group-item']")
  }

  setState(element, on) {
    element.dataset.state = on ? "on" : "off"
    element.setAttribute("aria-pressed", String(on))
  }
}
