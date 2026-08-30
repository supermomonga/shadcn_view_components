import { Controller } from "@hotwired/stimulus"

import { hideAfterExit } from "@supermomonga/shadcn-view-components/hide_after_exit"

const noop = () => {}

// ネイティブ <dialog> の開閉(05-stimulus-hotwire §3)。
// showModal がフォーカストラップ・背景inert・EscClose・フォーカス復帰を提供するため、
// このコントローラは「開く」「閉じる」「状態属性の同期」だけを担う。
// role=alertdialog の場合は Esc での棄却を抑止する(明示的なボタン操作を要求)。
// 閉じる際は契約クラスの退出アニメーション(data-[state=closed]:animate-out)を
// 待ってから dialog.close() する(即時 close するとアニメーションが見えない)
export default class DialogController extends Controller {
  /** @type {HTMLDialogElement | null} */
  dialog = null

  /** @type {() => void} */
  cancelExit = noop

  /** @type {() => void} */
  onClose = () => {
    this.cancelPendingExit()
    this.syncState("closed")
  }

  /** @type {(event: Event) => void} */
  onCancel = (event) => {
    if (this.dialog?.getAttribute("role") === "alertdialog") event.preventDefault()
  }

  /** @type {(event: Event) => void} */
  onSubmitEnd = (event) => {
    if (event.target instanceof Node && this.dialog?.contains(event.target)) this.close()
  }

  connect() {
    this.cancelPendingExit()
    this.dialog = this.element.querySelector("dialog")
    this.dialog?.addEventListener("close", this.onClose)
    this.dialog?.addEventListener("cancel", this.onCancel)
    // 標準フック: dialog内のフォーム送信完了(turbo:submit-end)で閉じる(10-roadmap Phase 3)
    this.root.addEventListener("turbo:submit-end", this.onSubmitEnd)
    this.syncState("closed")
  }

  disconnect() {
    const dialog = this.dialog
    const content = dialog?.querySelector("[data-slot$='-content']")
    const finishExit = dialog?.open && content?.hasAttribute("data-closed")
    this.cancelPendingExit()
    dialog?.removeEventListener("close", this.onClose)
    dialog?.removeEventListener("cancel", this.onCancel)
    this.root.removeEventListener("turbo:submit-end", this.onSubmitEnd)
    if (finishExit) dialog.close()
    this.dialog = null
  }

  show() {
    const dialog = this.dialog
    if (!dialog) return

    this.cancelPendingExit()
    if (!dialog.open) dialog.showModal()
    this.syncState("open")
  }

  // 状態属性の対象: dialog自身と、その中の content / overlay 系スロット。
  // SSRでは状態属性(data-open / data-closed)を出さないためスロット名で収集する
  /** @returns {HTMLElement[]} */
  stateTargets() {
    if (!this.dialog) return []

    const inner = /** @type {HTMLElement[]} */ (
      [...this.dialog.querySelectorAll("[data-slot$='-content'], [data-slot$='-overlay']")]
    )
    return [...inner, this.dialog]
  }

  close() {
    const dialog = this.dialog
    if (!dialog?.open) return

    this.cancelPendingExit()
    // 先に閉状態へ(animate-out のトリガ)。dialog.open はまだ true のため
    // syncState の実開状態ガードは使えず、ここでは直接書き換える
    for (const element of this.stateTargets()) this.applyState(element, "closed")

    const content = dialog.querySelector("[data-slot$='-content']")
    this.cancelExit = hideAfterExit(content, () => {
      if (this.dialog !== dialog || content?.hasAttribute("data-open")) return
      dialog.close()
    })
  }

  cancelPendingExit() {
    this.cancelExit()
    this.cancelExit = noop
  }

  // Turboキャッシュ復帰に備え、状態属性は冪等に再計算する(05 §6.2)
  /** @param {"open" | "closed"} state */
  syncState(state) {
    if (this.dialog && this.dialog.open !== (state === "open")) {
      // closeイベントを経由せず状態がずれた場合(ブラウザバック等)は実際の開状態を優先する
      state = this.dialog.open ? "open" : "closed"
    }
    for (const element of this.stateTargets()) this.applyState(element, state)
    for (const trigger of this.root.querySelectorAll("[aria-haspopup='dialog']")) {
      trigger.setAttribute("aria-expanded", String(state === "open"))
    }
  }

  // base-nova の契約クラスは data-open / data-closed(属性の存在)を参照する
  // (data-open:animate-in data-closed:animate-out 等)
  /**
   * @param {HTMLElement} element
   * @param {"open" | "closed"} state
   */
  applyState(element, state) {
    element.toggleAttribute("data-open", state === "open")
    element.toggleAttribute("data-closed", state !== "open")
  }

  /** @returns {HTMLElement} */
  get root() {
    return /** @type {HTMLElement} */ (this.element)
  }
}
