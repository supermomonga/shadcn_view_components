import { Controller } from "@hotwired/stimulus"

import { hideAfterExit } from "@supermomonga/shadcn-view-components/hide_after_exit"

// ネイティブ <details> の開閉を契約クラスのアニメーションと同期する。
// 契約の accordion-content は data-[state=open]:animate-accordion-down /
// data-[state=closed]:animate-accordion-up(tw-animate-css がキーフレームを提供、
// 高さは --radix-accordion-content-height を参照)を持つため:
//
// - summary クリックは既定の即時開閉を preventDefault で止める
// - 開く: 高さ変数を設定してから details を開き data-state=open を同期する
//   (アニメーションが高さ0 → 測定高さで走る)
// - 閉じる: data-state=closed を先に切り替え、accordion-up の終了を待ってから
//   details を閉じる(即時閉じるとコンテンツが一瞬で消えるため)
// - 排他(name 属性グループ)は開く際に他の開いている Item を閉じる
// - reduced-motion 設定時とJS無効時はアニメーション無しの即時開閉になる
/** @extends {Controller<HTMLElement>} */
export default class AccordionController extends Controller {
  /** @type {Map<HTMLDetailsElement, () => void>} */
  pendingCloses = new Map()

  /** @type {(event: MouseEvent) => void} */
  onClick = (event) => this.handleClick(event)

  /** @type {(event: Event) => void} */
  onToggle = (event) => this.handleToggle(event)

  connect() {
    this.element.addEventListener("click", this.onClick, true)
    // toggle はrootのcapture listenerで受ける。非bubbling eventでもcapture phaseは
    // ancestorを通るため、接続後に追加されたitemのプログラマティックな開閉にも追従できる。
    this.element.addEventListener("toggle", this.onToggle, true)
    for (const item of this.items()) this.syncState(item, item.open ? "open" : "closed")
  }

  disconnect() {
    this.element.removeEventListener("click", this.onClick, true)
    this.element.removeEventListener("toggle", this.onToggle, true)
    // Turbo cache等で退出アニメーション中に切断されても、listener/timerを残さず
    // ユーザーが確定させた閉状態をDOMへ反映してから破棄する。
    for (const [item, cancel] of this.pendingCloses) {
      cancel()
      item.open = false
      item.style.removeProperty("--radix-accordion-content-height")
      this.syncState(item, "closed")
    }
    this.pendingCloses.clear()
  }

  // キャプチャフェーズで一元処理する(data-action との二重発火防止 — 他コントローラと同じ)
  /** @param {MouseEvent} event */
  handleClick(event) {
    const summary = event.target instanceof Element ? event.target.closest("summary[data-slot='accordion-trigger']") : null
    if (!summary || !this.element.contains(summary)) return

    const item = /** @type {HTMLDetailsElement | null} */ (
      summary.closest("details[data-slot='accordion-item']")
    )
    if (!item) return

    event.preventDefault()
    if (item.open) {
      this.close(item)
    } else {
      for (const other of this.items()) {
        if (other !== item && other.open && this.sameGroup(other, item)) this.close(other)
      }
      this.open(item)
    }
  }

  /** @param {Event} event */
  handleToggle(event) {
    if (!(event.target instanceof Element)) return
    if (!event.target.matches("details[data-slot='accordion-item']") || !this.element.contains(event.target)) return

    const item = /** @type {HTMLDetailsElement} */ (event.target)
    if (item.open) this.cancelClose(item)
    this.syncState(item, item.open ? "open" : "closed")
  }

  /** @param {HTMLDetailsElement} item */
  open(item) {
    this.cancelClose(item)
    const content = this.contentOf(item)
    if (content && !this.reducedMotion) {
      item.style.setProperty("--radix-accordion-content-height", `${content.scrollHeight}px`)
    }
    item.open = true
    this.syncState(item, "open")
  }

  /** @param {HTMLDetailsElement} item */
  close(item) {
    this.cancelClose(item)
    const content = this.contentOf(item)
    if (!content || this.reducedMotion) {
      item.open = false
      item.style.removeProperty("--radix-accordion-content-height")
      this.syncState(item, "closed")
      return
    }

    this.syncState(item, "closed")
    const cancel = hideAfterExit(content, () => {
      this.pendingCloses.delete(item)
      item.open = false
      item.style.removeProperty("--radix-accordion-content-height")
    }, "accordion-up")
    this.pendingCloses.set(item, cancel)
  }

  /** @param {HTMLDetailsElement} item */
  cancelClose(item) {
    const cancel = this.pendingCloses.get(item)
    if (!cancel) return
    cancel()
    this.pendingCloses.delete(item)
  }

  // base-nova の契約クラスは data-open / data-closed(属性の存在)を参照する
  // (data-open:animate-accordion-down 等)。Trigger には aria-expanded も同期する
  // (アイコン切替は group-aria-expanded で行う)
  /**
   * @param {HTMLDetailsElement} item
   * @param {"open" | "closed"} state
   */
  syncState(item, state) {
    item.toggleAttribute("data-open", state === "open")
    item.toggleAttribute("data-closed", state !== "open")
    const trigger = item.querySelector("[data-slot='accordion-trigger']")
    if (trigger) trigger.setAttribute("aria-expanded", String(state === "open"))
    const content = this.contentOf(item)
    if (content) {
      content.toggleAttribute("data-open", state === "open")
      content.toggleAttribute("data-closed", state !== "open")
    }
  }

  /** @returns {HTMLDetailsElement[]} */
  items() {
    return /** @type {HTMLDetailsElement[]} */ (
      Array.from(this.element.querySelectorAll("details[data-slot='accordion-item']"))
    )
  }

  /**
   * @param {HTMLDetailsElement} item
   * @returns {HTMLElement | null}
   */
  contentOf(item) {
    return /** @type {HTMLElement | null} */ (
      item.querySelector(":scope > [data-slot='accordion-content']")
    )
  }

  /**
   * @param {HTMLDetailsElement} a
   * @param {HTMLDetailsElement} b
   */
  sameGroup(a, b) {
    return a.getAttribute("name") !== null && a.getAttribute("name") === b.getAttribute("name")
  }

  get reducedMotion() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches
  }
}
