// exit アニメーション(data-[state=closed]:animate-out)を待ってから要素を実際に隠す。
// ネイティブの非表示(hidePopover / dialog.close / hidden 属性)は即時なため、
// 契約クラスの animate-out が終わる前に隠すと退出アニメーションが見えない。
//
// 使い方: 事前に data-state=closed を設定してから
//   hideAfterExit(content, () => popover.hidePopover())
export function hideAfterExit(element, hide) {
  if (!element) {
    hide()
    return
  }
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    hide()
    return
  }

  let finished = false
  const done = () => {
    if (finished) return
    finished = true
    element.removeEventListener("animationend", onEnd)
    clearTimeout(timer)
    hide()
  }
  const onEnd = (event) => {
    if (event.target === element) done()
  }
  // animate-out が無い環境・クラスの時のフォールバック(tw-animate の既定は 150ms)
  const timer = setTimeout(done, 300)
  element.addEventListener("animationend", onEnd)
}
