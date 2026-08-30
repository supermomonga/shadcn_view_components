// base-nova の契約クラスは開閉状態を data-open / data-closed(属性の存在)で参照する
// (data-open:animate-in data-closed:animate-out 等)。
// 旧規約の data-state(open/closed)を使うコントローラが、状態を書き換えるついでに
// この属性群を同期するためのヘルパ。
/**
 * @param {Element | null | undefined} element
 * @param {"open" | "closed"} state
 */
export function applyStateAttrs(element, state) {
  if (!element) return
  element.toggleAttribute("data-open", state === "open")
  element.toggleAttribute("data-closed", state !== "open")
}
