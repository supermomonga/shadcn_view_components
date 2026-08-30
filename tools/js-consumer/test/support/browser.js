let openPopovers = new WeakSet()
let deferToggleEvents = false
let pendingToggleEvents = []
let reducedMotion = false
let resizeObservers = new Set()
let intersectionObservers = new Set()

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
      dispatchToggle(this)
    },
    hidePopover() {
      openPopovers.delete(this)
      dispatchToggle(this)
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

  class TestResizeObserver {
    constructor(callback) {
      this.callback = callback
      this.targets = new Set()
      resizeObservers.add(this)
    }

    observe(target) {
      this.targets.add(target)
    }

    unobserve(target) {
      this.targets.delete(target)
    }

    disconnect() {
      this.targets.clear()
      resizeObservers.delete(this)
    }
  }

  class TestIntersectionObserver {
    constructor(callback) {
      this.callback = callback
      this.targets = new Set()
      intersectionObservers.add(this)
    }

    observe(target) {
      this.targets.add(target)
    }

    unobserve(target) {
      this.targets.delete(target)
    }

    disconnect() {
      this.targets.clear()
      intersectionObservers.delete(this)
    }
  }

  Object.defineProperty(window, "ResizeObserver", {
    configurable: true,
    value: TestResizeObserver,
  })
  Object.defineProperty(window, "IntersectionObserver", {
    configurable: true,
    value: TestIntersectionObserver,
  })
}

export function resetBrowserShims() {
  openPopovers = new WeakSet()
  deferToggleEvents = false
  pendingToggleEvents = []
  reducedMotion = false
  for (const observer of [...resizeObservers]) observer.disconnect()
  for (const observer of [...intersectionObservers]) observer.disconnect()
  resizeObservers = new Set()
  intersectionObservers = new Set()
}

export function setToggleEventsDeferred(value) {
  deferToggleEvents = value
}

export function flushToggleEvents() {
  const elements = pendingToggleEvents
  pendingToggleEvents = []
  for (const element of elements) element.dispatchEvent(new Event("toggle"))
}

export function setReducedMotion(value) {
  reducedMotion = value
}

export function notifyResize(target) {
  for (const observer of [...resizeObservers]) {
    if (observer.targets.has(target)) observer.callback([], observer)
  }
}

export function notifyAnchorMove(target) {
  for (const observer of [...intersectionObservers]) {
    if (observer.targets.has(target)) observer.callback([], observer)
  }
}

export function resizeObserverCount(target) {
  if (!target) return resizeObservers.size
  return [...resizeObservers].filter((observer) => observer.targets.has(target)).length
}

export function intersectionObserverCount(target) {
  if (!target) return intersectionObservers.size
  return [...intersectionObservers].filter((observer) => observer.targets.has(target)).length
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

/** @param {HTMLElement} element */
function dispatchToggle(element) {
  if (deferToggleEvents) pendingToggleEvents.push(element)
  else element.dispatchEvent(new Event("toggle"))
}
