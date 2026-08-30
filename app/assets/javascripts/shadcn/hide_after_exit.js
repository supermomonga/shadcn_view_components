// exit アニメーション(data-[state=closed]:animate-out)を待ってから要素を実際に隠す。
// ネイティブの非表示(hidePopover / dialog.close / hidden 属性)は即時なため、
// 契約クラスの animate-out が終わる前に隠すと退出アニメーションが見えない。
//
// 使い方: 事前に data-state=closed を設定してから
//   const cancel = hideAfterExit(content, () => popover.hidePopover())
// open / disconnect 時に cancel() すると、古い退出処理は何も変更しない。
/**
 * @param {Element | null | undefined} element
 * @param {() => void} hide
 * @param {string} [exitAnimationName]
 * @returns {() => void}
 */
export function hideAfterExit(element, hide, exitAnimationName = "exit") {
  if (!element) {
    hide()
    return () => {}
  }
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    hide()
    return () => {}
  }

  let finished = false
  /** @type {ReturnType<typeof setTimeout> | undefined} */
  let timer
  const cleanup = () => {
    element.removeEventListener("animationend", onEnd)
    element.removeEventListener("animationcancel", onEnd)
    if (timer !== undefined) clearTimeout(timer)
  }
  const done = () => {
    if (finished) return
    finished = true
    cleanup()
    hide()
  }
  /** @param {Event} event */
  const onEnd = (event) => {
    const animationEvent = /** @type {AnimationEvent} */ (event)
    if (event.target === element && animationEvent.animationName === exitAnimationName) done()
  }
  // animate-out が無い環境・クラスの時のフォールバック(tw-animate の既定は 150ms)
  timer = setTimeout(done, 300)
  element.addEventListener("animationend", onEnd)
  element.addEventListener("animationcancel", onEnd)

  return () => {
    if (finished) return
    finished = true
    cleanup()
  }
}
