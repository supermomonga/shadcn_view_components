import { Controller } from "@hotwired/stimulus"

import {
  ensureId,
  ensureRootId,
  ownedElements,
  setDefaultAttribute,
} from "@supermomonga/shadcn-view-components/aria_relationships"
import { hideAfterExit } from "@supermomonga/shadcn-view-components/hide_after_exit"

const noop = () => {}
const IDENTIFIER = "shadcn--dialog"
const TRIGGER_SELECTOR = [
  "[data-slot='dialog-trigger']",
  "[data-slot='alert-dialog-trigger']",
  "[data-slot='sheet-trigger']",
  "[data-slot='drawer-trigger']",
].join(", ")
const TITLE_SELECTOR = [
  "[data-slot='dialog-title']",
  "[data-slot='alert-dialog-title']",
  "[data-slot='sheet-title']",
  "[data-slot='drawer-title']",
].join(", ")
const DESCRIPTION_SELECTOR = [
  "[data-slot='dialog-description']",
  "[data-slot='alert-dialog-description']",
  "[data-slot='sheet-description']",
  "[data-slot='drawer-description']",
].join(", ")
const CONTENT_SELECTOR = [
  "[data-slot='dialog-content']",
  "[data-slot='alert-dialog-content']",
  "[data-slot='sheet-content']",
  "[data-slot='drawer-content']",
].join(", ")
const STATE_SELECTOR = [
  CONTENT_SELECTOR,
  "[data-slot='dialog-overlay']",
  "[data-slot='alert-dialog-overlay']",
  "[data-slot='sheet-overlay']",
  "[data-slot='drawer-overlay']",
].join(", ")

// ネイティブ <dialog> の開閉(05-stimulus-hotwire §3)。
// showModal がフォーカストラップ・背景inert・EscClose・フォーカス復帰を提供するため、
// このコントローラは「開く」「閉じる」「状態属性の同期」だけを担う。
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
  onSubmitEnd = (event) => {
    if (!(event.target instanceof Element) || !this.dialog?.contains(event.target)) return
    if (event.target.closest(`[data-controller~='${IDENTIFIER}']`) !== this.root) return

    this.close()
  }

  connect() {
    this.cancelPendingExit()
    this.dialog = /** @type {HTMLDialogElement | null} */ (
      ownedElements(this.root, "dialog", IDENTIFIER)[0] || null
    )
    this.ensureRelationships()
    this.dialog?.addEventListener("close", this.onClose)
    // 標準フック: dialog内のフォーム送信完了(turbo:submit-end)で閉じる(10-roadmap Phase 3)
    this.root.addEventListener("turbo:submit-end", this.onSubmitEnd)
    this.syncState("closed")
  }

  disconnect() {
    const dialog = this.dialog
    const content = this.contentTarget()
    const finishExit = dialog?.open && content?.hasAttribute("data-closed")
    this.cancelPendingExit()
    dialog?.removeEventListener("close", this.onClose)
    this.root.removeEventListener("turbo:submit-end", this.onSubmitEnd)
    if (finishExit) dialog.close()
    this.dialog = null
  }

  show() {
    const dialog = this.dialog
    if (!dialog) return

    this.ensureRelationships()
    this.cancelPendingExit()
    if (!dialog.open) dialog.showModal()
    this.syncState("open")
  }

  // 状態属性の対象: dialog自身と、その中の content / overlay 系スロット。
  // SSRでは状態属性(data-open / data-closed)を出さないためスロット名で収集する
  /** @returns {HTMLElement[]} */
  stateTargets() {
    if (!this.dialog) return []

    const inner = ownedElements(
      this.root,
      STATE_SELECTOR,
      IDENTIFIER,
    ).filter((element) => element !== this.dialog && this.dialog?.contains(element))
    return [...inner, this.dialog]
  }

  close() {
    const dialog = this.dialog
    if (!dialog?.open) return

    this.cancelPendingExit()
    // 先に閉状態へ(animate-out のトリガ)。dialog.open はまだ true のため
    // syncState の実開状態ガードは使えず、ここでは直接書き換える
    for (const element of this.stateTargets()) this.applyState(element, "closed")

    const content = this.contentTarget()
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
    for (const trigger of this.triggers()) {
      trigger.setAttribute("aria-expanded", String(state === "open"))
    }
  }

  ensureRelationships() {
    const dialog = this.dialog
    if (!dialog) return

    const rootId = ensureRootId(this.root, "dialog")
    const dialogId = ensureId(dialog, `${rootId}-content`)
    const title = this.ownedWithinDialog(TITLE_SELECTOR)[0]
    const description = this.ownedWithinDialog(DESCRIPTION_SELECTOR)[0]

    for (const trigger of this.triggers()) setDefaultAttribute(trigger, "aria-controls", dialogId)

    if (title) {
      const titleId = ensureId(title, `${rootId}-title`)
      if (!dialog.hasAttribute("aria-label")) setDefaultAttribute(dialog, "aria-labelledby", titleId)
    }
    if (description) {
      const descriptionId = ensureId(description, `${rootId}-description`)
      if (!dialog.hasAttribute("aria-description")) {
        setDefaultAttribute(dialog, "aria-describedby", descriptionId)
      }
    }
  }

  /** @returns {HTMLElement[]} */
  triggers() {
    return ownedElements(this.root, TRIGGER_SELECTOR, IDENTIFIER)
  }

  /** @param {string} selector @returns {HTMLElement[]} */
  ownedWithinDialog(selector) {
    return ownedElements(this.root, selector, IDENTIFIER)
      .filter((element) => this.dialog?.contains(element))
  }

  /** @returns {HTMLElement | null} */
  contentTarget() {
    if (this.dialog?.matches(CONTENT_SELECTOR)) return this.dialog

    return this.ownedWithinDialog(CONTENT_SELECTOR)[0] || null
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
