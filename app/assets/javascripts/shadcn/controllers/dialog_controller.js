import { Controller } from "@hotwired/stimulus"

import { hideAfterExit } from "@supermomonga/shadcn-view-components/hide_after_exit"

// ネイティブ <dialog> の開閉(05-stimulus-hotwire §3)。
// showModal がフォーカストラップ・背景inert・EscClose・フォーカス復帰を提供するため、
// このコントローラは「開く」「閉じる」「状態属性の同期」だけを担う。
// role=alertdialog の場合は Esc での棄却を抑止する(明示的なボタン操作を要求)。
// 閉じる際は契約クラスの退出アニメーション(data-[state=closed]:animate-out)を
// 待ってから dialog.close() する(即時 close するとアニメーションが見えない)
export default class DialogController extends Controller {
  connect() {
    this.dialog = this.element.querySelector("dialog")
    if (this.dialog) {
      this.onClose = () => this.syncState("closed")
      this.onCancel = (event) => {
        if (this.dialog.getAttribute("role") === "alertdialog") event.preventDefault()
      }
      this.dialog.addEventListener("close", this.onClose)
      this.dialog.addEventListener("cancel", this.onCancel)
    }
    // 標準フック: dialog内のフォーム送信完了(turbo:submit-end)で閉じる(10-roadmap Phase 3)
    this.onSubmitEnd = (event) => {
      if (this.dialog?.contains(event.target)) this.close()
    }
    this.element.addEventListener("turbo:submit-end", this.onSubmitEnd)
    this.syncState("closed")
  }

  disconnect() {
    // dialog が無い構成でも turbo:submit-end の除去は必須(接続サイクルごとの
    // リスナー蓄積を防ぐ — 他コントローラと同じ ?. 書式に統一)
    this.dialog?.removeEventListener("close", this.onClose)
    this.dialog?.removeEventListener("cancel", this.onCancel)
    this.element.removeEventListener("turbo:submit-end", this.onSubmitEnd)
  }

  show() {
    this.dialog?.showModal()
    this.syncState("open")
  }

  // 状態属性の対象: dialog自身と、その中の content / overlay 系スロット。
  // SSRでは状態属性(data-open / data-closed)を出さないためスロット名で収集する
  stateTargets() {
    const inner = this.dialog
      ? this.dialog.querySelectorAll("[data-slot$='-content'], [data-slot$='-overlay']")
      : []
    return [...inner, ...(this.dialog ? [this.dialog] : [])]
  }

  close() {
    if (!this.dialog || !this.dialog.open) return

    // 先に閉状態へ(animate-out のトリガ)。dialog.open はまだ true のため
    // syncState の実開状態ガードは使えず、ここでは直接書き換える
    for (const element of this.stateTargets()) {
      this.applyState(element, "closed")
    }
    const content = this.dialog.querySelector("[data-slot$='-content']")
    hideAfterExit(content, () => {
      // 退出中に再オープンされた場合は閉じない
      if (content?.hasAttribute("data-open")) return
      this.dialog?.close()
    })
  }

  // Turboキャッシュ復帰に備え、状態属性は冪等に再計算する(05 §6.2)
  syncState(state) {
    if (this.dialog && this.dialog.open !== (state === "open")) {
      // closeイベントを経由せず状態がずれた場合(ブラウザバック等)は実際の開状態を優先する
      state = this.dialog.open ? "open" : "closed"
    }
    for (const element of this.stateTargets()) {
      this.applyState(element, state)
    }
    for (const trigger of this.element.querySelectorAll("[aria-haspopup='dialog']")) {
      trigger.setAttribute("aria-expanded", String(state === "open"))
    }
  }

  // base-nova の契約クラスは data-open / data-closed(属性の存在)を参照する
  // (data-open:animate-in data-closed:animate-out 等)
  applyState(element, state) {
    element.toggleAttribute("data-open", state === "open")
    element.toggleAttribute("data-closed", state !== "open")
  }
}
