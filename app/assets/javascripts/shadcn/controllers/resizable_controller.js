import { Controller } from "@hotwired/stimulus"

// ハンドルのドラッグ/矢印キーで前後パネルの flex-basis を配分する
// (10-roadmap Phase 3「resizable = CSS grid + ドラッグ」)
export default class ResizableController extends Controller {
  connect() {
    this.onMove = (event) => this.drag(event)
    this.onUp = () => this.endDrag()
    document.addEventListener("mousemove", this.onMove)
    document.addEventListener("mouseup", this.onUp)
  }

  disconnect() {
    document.removeEventListener("mousemove", this.onMove)
    document.removeEventListener("mouseup", this.onUp)
  }

  get panels() {
    return [...this.element.querySelectorAll("[data-slot='resizable-panel']")]
  }

  handleFor(event) {
    return event.currentTarget.closest("[data-slot='resizable-handle']")
  }

  startDrag(event) {
    event.preventDefault()
    // preventDefaultするとフォーカス移動が阻害されるため明示的に移す(キーボード操作のため)
    event.currentTarget.focus()
    this.dragging = this.handleFor(event)
  }

  endDrag() {
    this.dragging = null
  }

  drag(event) {
    if (!this.dragging) return
    const handle = this.dragging
    const group = handle.parentElement
    const panels = [...group.querySelectorAll(":scope > [data-slot='resizable-panel']")]
    const index = [...group.children].indexOf(handle) - 1
    const before = panels[index]
    const after = panels[index + 1]
    if (!before || !after) return

    const vertical = handle.getAttribute("aria-orientation") === "vertical"
    const rect = group.getBoundingClientRect()
    const position = vertical
      ? (event.clientY - rect.top) / rect.height
      : (event.clientX - rect.left) / rect.width
    this.applySplit(before, after, Math.min(0.9, Math.max(0.1, position)))
  }

  nudge(event) {
    const handle = this.handleFor(event)
    const keys = ["ArrowLeft", "ArrowRight"]
    if (!handle || !keys.includes(event.key)) return
    event.preventDefault()

    const group = handle.parentElement
    const panels = [...group.querySelectorAll(":scope > [data-slot='resizable-panel']")]
    const index = [...group.children].indexOf(handle) - 1
    const before = panels[index]
    const after = panels[index + 1]
    if (!before || !after) return

    const current = parseFloat(before.style.flexBasis || before.style.getPropertyValue("flex-basis")) / 100 || 0.5
    const next = Math.min(0.9, Math.max(0.1, current + (event.key === "ArrowRight" ? 0.05 : -0.05)))
    this.applySplit(before, after, next)
  }

  applySplit(before, after, ratio) {
    before.style.flexBasis = `${ratio * 100}%`
    before.style.flexGrow = "0"
    after.style.flexBasis = `${(1 - ratio) * 100}%`
    after.style.flexGrow = "0"
  }
}
