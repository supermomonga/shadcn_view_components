import { Controller } from "@hotwired/stimulus"

import { hideAfterExit } from "@supermomonga/shadcn-view-components/hide_after_exit"
import { applyStateAttrs } from "@supermomonga/shadcn-view-components/state_attrs"

// Popover API(popover="auto")の開閉同期と位置合わせ。
// 軽い外側クリック解散(light dismiss)はネイティブが担い、ここでは
// data-state / aria-expanded の同期と、trigger 直下への位置合わせを行う。
// trigger からの明示的な閉じ操作では退出アニメーションを待つ
// (ネイティブの light dismiss は即時解散のためアニメーション無し)
export default class PopoverController extends Controller {
  connect() {
    this.content = this.element.querySelector("[popover]")
    this.trigger = this.element.querySelector("[data-slot='popover-trigger']")
    if (this.content) {
      this.onToggle = () => this.syncState()
      this.content.addEventListener("toggle", this.onToggle)
    }
    this.syncState()
  }

  disconnect() {
    this.content?.removeEventListener("toggle", this.onToggle)
  }

  toggle() {
    if (!this.content) return
    if (this.content.matches(":popover-open")) {
      this.content.dataset.state = "closed"
    applyStateAttrs(this.content, "closed")
      hideAfterExit(this.content, () => {
        if (this.content?.dataset.state === "open") return
        this.content.hidePopover()
      })
    } else {
      // toggle イベントは非同期のため、表示前に属性を先に切り替える
      this.content.dataset.state = "open"
    applyStateAttrs(this.content, "open")
      this.content.togglePopover()
    }
  }

  syncState() {
    if (!this.content) return
    const state = this.content.matches(":popover-open") ? "open" : "closed"
    this.content.dataset.state = state
    applyStateAttrs(this.content, state)
    this.trigger?.setAttribute("aria-expanded", String(state === "open"))
    if (state === "open") this.position()
  }

  // align=center / sideOffset 既定(下方向)の位置合わせ。
  // anchor positioning 非対応環境でも成立するよう JS で算出する
  position() {
    if (!this.trigger) return
    this.content.dataset.side = "bottom"
    const rect = this.trigger.getBoundingClientRect()
    const offset = Number(this.content.dataset.sideOffset ?? 4)
    const style = this.content.style
    style.position = "fixed"
    style.margin = "0"
    const left = rect.left + rect.width / 2 - this.content.offsetWidth / 2
    style.left = `${Math.max(8, Math.min(left, window.innerWidth - this.content.offsetWidth - 8))}px`
    style.top = `${rect.bottom + offset}px`
  }
}
