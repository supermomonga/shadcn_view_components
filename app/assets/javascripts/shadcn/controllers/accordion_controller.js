import { Controller } from "@hotwired/stimulus"

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
export default class AccordionController extends Controller {
  connect() {
    this.onClick = (event) => this.handleClick(event)
    this.onToggle = (event) => this.syncState(event.target, event.target.open ? "open" : "closed")
    this.element.addEventListener("click", this.onClick, true)
    // プログラマティックな開閉(item.open = true 等)にも追従する
    for (const item of this.items()) item.addEventListener("toggle", this.onToggle)
    for (const item of this.items()) this.syncState(item, item.open ? "open" : "closed")
  }

  disconnect() {
    this.element.removeEventListener("click", this.onClick, true)
    for (const item of this.items()) item.removeEventListener("toggle", this.onToggle)
  }

  // キャプチャフェーズで一元処理する(data-action との二重発火防止 — 他コントローラと同じ)
  handleClick(event) {
    const summary = event.target instanceof Element ? event.target.closest("summary[data-slot='accordion-trigger']") : null
    if (!summary || !this.element.contains(summary)) return

    const item = summary.closest("details[data-slot='accordion-item']")
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

  open(item) {
    const content = this.contentOf(item)
    if (content && !this.reducedMotion) {
      item.style.setProperty("--radix-accordion-content-height", `${content.scrollHeight}px`)
    }
    item.open = true
    this.syncState(item, "open")
  }

  close(item) {
    const content = this.contentOf(item)
    if (!content || this.reducedMotion) {
      item.open = false
      this.syncState(item, "closed")
      return
    }

    const onEnd = (event) => {
      if (event.target !== content || event.animationName !== "accordion-up") return
      content.removeEventListener("animationend", onEnd)
      item.open = false
      item.style.removeProperty("--radix-accordion-content-height")
    }
    content.addEventListener("animationend", onEnd)
    this.syncState(item, "closed")
  }

  // base-nova の契約クラスは data-open / data-closed(属性の存在)を参照する
  // (data-open:animate-accordion-down 等)。Trigger には aria-expanded も同期する
  // (アイコン切替は group-aria-expanded で行う)
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

  items() {
    return Array.from(this.element.querySelectorAll("details[data-slot='accordion-item']"))
  }

  contentOf(item) {
    return item.querySelector(":scope > [data-slot='accordion-content']")
  }

  sameGroup(a, b) {
    return a.getAttribute("name") !== null && a.getAttribute("name") === b.getAttribute("name")
  }

  get reducedMotion() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches
  }
}
