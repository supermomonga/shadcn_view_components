import { Controller } from "@hotwired/stimulus"

// ハンドルのドラッグ/矢印キーで前後パネルの flex-basis を配分する
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

  handleFor(event) {
    return event.currentTarget.closest("[data-slot='resizable-handle']")
  }

  // セパレータ自身が horizontal のとき縦積みグループ(上下方向にリサイズ)。
  // aria-orientation はセパレータの向きであり、グループの向きの逆
  isVerticalGroup(handle) {
    return handle.getAttribute("aria-orientation") === "horizontal"
  }

  // 前後の対はハンドルより手前に何個パネルがあるかで決める
  // (子要素全体の index だとハンドル数が挟まる3パネル以上で対がずれる)
  pairFor(handle) {
    const group = handle.closest("[data-slot='resizable-panel-group']")
    if (!group) return null
    const panels = [...group.querySelectorAll(":scope > [data-slot='resizable-panel']")]
    let count = 0
    for (let el = handle.previousElementSibling; el; el = el.previousElementSibling) {
      if (el.matches("[data-slot='resizable-panel']")) count++
    }
    const before = panels[count - 1]
    const after = panels[count]
    return before && after ? { before, after } : null
  }

  startDrag(event) {
    const handle = this.handleFor(event)
    const pair = this.pairFor(handle)
    if (!pair) return
    event.preventDefault()
    // preventDefaultするとフォーカス移動が阻害されるため明示的に移す(キーボード操作のため)
    event.currentTarget.focus()

    // 開始時の比率を基準に以降は移動量だけで追従する
    // (カーソルの絶対位置をそのまま比率にすると、掴んだ瞬間パネルが跳ぶ)
    const vertical = this.isVerticalGroup(handle)
    const beforeRect = pair.before.getBoundingClientRect()
    const afterRect = pair.after.getBoundingClientRect()
    const beforeSize = vertical ? beforeRect.height : beforeRect.width
    const total = beforeSize + (vertical ? afterRect.height : afterRect.width) || 1
    this.dragging = {
      ...pair,
      vertical,
      ratio: beforeSize / total,
      start: vertical ? event.clientY : event.clientX
    }
  }

  endDrag() {
    this.dragging = null
  }

  drag(event) {
    if (!this.dragging) return
    const { before, after, vertical, ratio, start } = this.dragging
    const rect = before.closest("[data-slot='resizable-panel-group']").getBoundingClientRect()
    const size = vertical ? rect.height : rect.width
    if (size === 0) return
    const delta = ((vertical ? event.clientY : event.clientX) - start) / size
    this.applySplit(before, after, Math.min(0.9, Math.max(0.1, ratio + delta)))
  }

  nudge(event) {
    const handle = this.handleFor(event)
    const pair = handle && this.pairFor(handle)
    if (!pair) return
    const vertical = this.isVerticalGroup(handle)
    const keys = vertical ? ["ArrowUp", "ArrowDown"] : ["ArrowLeft", "ArrowRight"]
    if (!keys.includes(event.key)) return
    event.preventDefault()

    const positive = vertical ? event.key === "ArrowDown" : event.key === "ArrowRight"
    const next = Math.min(0.9, Math.max(0.1, this.currentRatio(pair.before) + (positive ? 0.05 : -0.05)))
    this.applySplit(pair.before, pair.after, next)
  }

  // 均等割りの既定は 0.5。flex-basis は % 表記のときだけ信頼する(0 等は 0.5 扱い)
  currentRatio(before) {
    const basis = before.style.flexBasis
    return basis.endsWith("%") ? parseFloat(basis) / 100 : 0.5
  }

  applySplit(before, after, ratio) {
    before.style.flexBasis = `${ratio * 100}%`
    before.style.flexGrow = "0"
    after.style.flexBasis = `${(1 - ratio) * 100}%`
    after.style.flexGrow = "0"
  }
}
