let openPopovers = new WeakSet()
let reducedMotion = false

const originalMatches = Element.prototype.matches

export function installBrowserShims() {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: (query) => ({
      addEventListener() {},
      matches: reducedMotion && query === "(prefers-reduced-motion: reduce)",
      media: query,
      removeEventListener() {},
    }),
  })

  Element.prototype.matches = function matches(selector) {
    if (selector === ":popover-open") return openPopovers.has(this)
    return originalMatches.call(this, selector)
  }

  for (const [name, value] of Object.entries({
    showPopover() {
      openPopovers.add(this)
      this.dispatchEvent(new Event("toggle"))
    },
    hidePopover() {
      openPopovers.delete(this)
      this.dispatchEvent(new Event("toggle"))
    },
    togglePopover() {
      if (openPopovers.has(this)) this.hidePopover()
      else this.showPopover()
    },
  })) {
    Object.defineProperty(HTMLElement.prototype, name, { configurable: true, value, writable: true })
  }

  Object.defineProperty(HTMLDialogElement.prototype, "showModal", {
    configurable: true,
    value() {
      this.open = true
    },
    writable: true,
  })
  Object.defineProperty(HTMLDialogElement.prototype, "close", {
    configurable: true,
    value() {
      this.open = false
      this.dispatchEvent(new Event("close"))
    },
    writable: true,
  })
}

export function resetBrowserShims() {
  openPopovers = new WeakSet()
  reducedMotion = false
}

export function setReducedMotion(value) {
  reducedMotion = value
}

/**
 * jsdom には AnimationEvent constructor がないため、animationName を持つ
 * 通常の Event を作って実ブラウザと同じ終了通知を再現する。
 *
 * @param {"animationend" | "animationcancel"} type
 * @param {string} animationName
 * @returns {Event}
 */
export function animationEvent(type, animationName) {
  const event = new Event(type)
  Object.defineProperty(event, "animationName", { value: animationName })
  return event
}
