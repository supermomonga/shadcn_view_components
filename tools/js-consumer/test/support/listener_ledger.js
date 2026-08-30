const listeners = new WeakMap()
const originalAddEventListener = EventTarget.prototype.addEventListener
const originalRemoveEventListener = EventTarget.prototype.removeEventListener

function captureOf(options) {
  return typeof options === "boolean" ? options : (options?.capture ?? false)
}

function listenersFor(target, type, create = false) {
  let byType = listeners.get(target)
  if (!byType && create) {
    byType = new Map()
    listeners.set(target, byType)
  }
  if (!byType) return undefined

  let entries = byType.get(type)
  if (!entries && create) {
    entries = []
    byType.set(type, entries)
  }
  return entries
}

export function installListenerLedger() {
  EventTarget.prototype.addEventListener = function addEventListener(type, listener, options) {
    if (listener) {
      const entries = listenersFor(this, type, true)
      const capture = captureOf(options)
      if (!entries.some((entry) => entry.listener === listener && entry.capture === capture)) {
        entries.push({ capture, listener })
      }
    }
    return originalAddEventListener.call(this, type, listener, options)
  }

  EventTarget.prototype.removeEventListener = function removeEventListener(type, listener, options) {
    const entries = listenersFor(this, type)
    const capture = captureOf(options)
    const index = entries?.findIndex((entry) => entry.listener === listener && entry.capture === capture) ?? -1
    if (index >= 0) entries.splice(index, 1)
    return originalRemoveEventListener.call(this, type, listener, options)
  }
}

export function listenerCount(target, type) {
  return listenersFor(target, type)?.length ?? 0
}
