const GENERATED_ID_ATTRIBUTE = "data-shadcn-generated-id"
const GENERATED_ROOT_ID_ATTRIBUTE = "data-shadcn-generated-root-id"

/** @param {string} id @param {Element} element */
function idBelongsToAnotherElement(id, element) {
  return [...document.querySelectorAll("[id]")].some((candidate) => candidate !== element && candidate.id === id)
}

/** @param {string} base @param {Element} element */
function uniqueId(base, element) {
  let candidate = base
  let suffix = 2
  while (idBelongsToAnotherElement(candidate, element)) candidate = `${base}-${suffix++}`
  return candidate
}

function randomSuffix() {
  if (typeof window.crypto?.randomUUID === "function") return window.crypto.randomUUID()

  const values = new Uint32Array(4)
  window.crypto.getRandomValues(values)
  return [...values].map((value) => value.toString(16).padStart(8, "0")).join("")
}

/**
 * SSRで生成したroot IDを返す。fragment cache由来の同一IDがdocument内で
 * 重複した場合だけ、自動生成IDを現在のroot専用に差し替える。
 * 利用者指定IDは重複していても変更しない。
 *
 * @param {HTMLElement} root
 * @param {string} prefix
 */
export function ensureRootId(root, prefix) {
  const generated = root.getAttribute(GENERATED_ROOT_ID_ATTRIBUTE) === "true"
  if (!root.id || (generated && idBelongsToAnotherElement(root.id, root))) {
    root.id = uniqueId(`shadcn-${prefix}-${randomSuffix()}`, root)
    root.setAttribute(GENERATED_ROOT_ID_ATTRIBUTE, "true")
  }
  return root.id
}

/**
 * 利用者指定IDを保ち、IDが無い要素だけroot由来の候補で補う。
 * 自動生成済みの要素はroot再採番時に追従させる。
 *
 * @param {HTMLElement} element
 * @param {string} candidate
 */
export function ensureId(element, candidate) {
  const generated = element.getAttribute(GENERATED_ID_ATTRIBUTE) === "true"
  if (element.id && !generated) return element.id

  element.id = uniqueId(candidate, element)
  element.setAttribute(GENERATED_ID_ATTRIBUTE, "true")
  return element.id
}

/**
 * 同名Stimulus controllerの入れ子を親controllerの探索結果から除外する。
 *
 * @param {HTMLElement} root
 * @param {string} selector
 * @param {string} identifier
 * @returns {HTMLElement[]}
 */
export function ownedElements(root, selector, identifier) {
  return /** @type {HTMLElement[]} */ (
    [...root.querySelectorAll(selector)].filter(
      (element) => element.closest(`[data-controller~='${identifier}']`) === root,
    )
  )
}

/**
 * 利用者指定属性を保ち、未指定または以前このhelperが補った属性だけを更新する。
 * root IDがキャッシュ重複対策で変わった場合も、生成した参照だけが追従する。
 *
 * @param {Element} element
 * @param {string} name
 * @param {string} value
 */
export function setDefaultAttribute(element, name, value) {
  const marker = `data-shadcn-generated-${name}`
  if (element.hasAttribute(name) && element.getAttribute(marker) !== "true") return

  element.setAttribute(name, value)
  element.setAttribute(marker, "true")
}
