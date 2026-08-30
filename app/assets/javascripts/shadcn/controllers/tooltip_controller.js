import { Controller } from "@hotwired/stimulus"

import { startFloatingPosition } from "@supermomonga/shadcn-view-components/floating_position"
import { hideAfterExit } from "@supermomonga/shadcn-view-components/hide_after_exit"
import { applyStateAttrs } from "@supermomonga/shadcn-view-components/state_attrs"

const noop = () => {}

// ツールチップの遅延制御(既定 delayDuration=0 — upstream と同じ)。
// aria-describedby で trigger と内容を結合する(05 §4)。
// 閉じる際は退出アニメーション(data-[state=closed]:animate-out)を待ってから
// hidden 属性を付ける(即時 hidden にするとアニメーションが見えない)
export default class TooltipController extends Controller {
  /** @type {HTMLElement | null} */
  content = null

  /** @type {HTMLElement | null} */
  trigger = null

  /** @type {ReturnType<typeof setTimeout> | undefined} */
  showTimer

  /** @type {() => void} */
  cancelExit = noop

  /** @type {{ update: () => void, destroy: () => void } | null} */
  positioning = null

  connect() {
    this.cancelPendingWork()
    this.stopPositioning()
    this.content = this.element.querySelector("[data-slot='tooltip-content']")
    this.trigger = this.element.querySelector("[data-slot='tooltip-trigger']")
    if (this.content?.id && this.trigger) this.trigger.setAttribute("aria-describedby", this.content.id)
  }

  disconnect() {
    const content = this.content
    const finishExit = content?.dataset.state === "closed" && !content.hidden
    this.cancelPendingWork()
    this.stopPositioning()
    if (finishExit) content.hidden = true
    this.content = null
    this.trigger = null
  }

  show() {
    this.cancelPendingExit()
    if (!this.content || this.content.dataset.state === "open") return

    this.clearShowTimer()
    const content = this.content
    this.showTimer = setTimeout(() => {
      this.showTimer = undefined
      if (this.content === content) this.setState("open")
    }, 0)
  }

  hide() {
    this.clearShowTimer()
    const content = this.content
    if (!content || content.hidden || content.dataset.state === "closed") return

    this.cancelPendingExit()
    content.dataset.state = "closed"
    applyStateAttrs(content, "closed")
    this.cancelExit = hideAfterExit(content, () => {
      if (this.content !== content || content.dataset.state === "open") return
      this.stopPositioning()
      content.hidden = true
    })
  }

  /** @param {"open" | "closed"} state */
  setState(state) {
    const content = this.content
    if (!content) return
    if (state === "open") this.cancelPendingExit()

    content.dataset.state = state
    applyStateAttrs(content, state)
    content.hidden = state === "closed"
    if (state === "open") this.startPositioning()
    else this.stopPositioning()
  }

  startPositioning() {
    const content = this.content
    const trigger = this.trigger
    if (!content || !trigger) return

    this.stopPositioning()
    this.positioning = startFloatingPosition({
      align: "center",
      anchor: trigger,
      collisionPadding: 5,
      floating: content,
      side: "top",
      sideOffset: 4,
    })
  }

  stopPositioning() {
    this.positioning?.destroy()
    this.positioning = null
  }

  clearShowTimer() {
    if (this.showTimer === undefined) return
    clearTimeout(this.showTimer)
    this.showTimer = undefined
  }

  cancelPendingExit() {
    this.cancelExit()
    this.cancelExit = noop
  }

  cancelPendingWork() {
    this.clearShowTimer()
    this.cancelPendingExit()
  }
}
