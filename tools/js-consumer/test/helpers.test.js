import { afterEach, describe, expect, it, vi } from "vitest"

import { hideAfterExit } from "@supermomonga/shadcn-view-components/hide_after_exit"
import { applyStateAttrs } from "@supermomonga/shadcn-view-components/state_attrs"

import { animationEvent, setReducedMotion } from "./support/browser.js"
import { listenerCount } from "./support/listener_ledger.js"

describe("hideAfterExit", () => {
  afterEach(() => vi.useRealTimers())

  it("completes on animation cancel and releases its timer and listeners", () => {
    vi.useFakeTimers()
    const element = document.createElement("div")
    const hide = vi.fn()

    hideAfterExit(element, hide)
    expect(listenerCount(element, "animationend")).toBe(1)
    expect(listenerCount(element, "animationcancel")).toBe(1)

    element.dispatchEvent(animationEvent("animationcancel", "exit"))

    expect(hide).toHaveBeenCalledOnce()
    expect(listenerCount(element, "animationend")).toBe(0)
    expect(listenerCount(element, "animationcancel")).toBe(0)
    expect(vi.getTimerCount()).toBe(0)
  })

  it("ignores cancellation of an opening animation before the exit animation", () => {
    vi.useFakeTimers()
    const element = document.createElement("div")
    const hide = vi.fn()

    hideAfterExit(element, hide)
    element.dispatchEvent(animationEvent("animationcancel", "enter"))

    expect(hide).not.toHaveBeenCalled()
    expect(listenerCount(element, "animationend")).toBe(1)
    expect(listenerCount(element, "animationcancel")).toBe(1)
    expect(vi.getTimerCount()).toBe(1)

    element.dispatchEvent(animationEvent("animationend", "exit"))

    expect(hide).toHaveBeenCalledOnce()
    expect(listenerCount(element, "animationend")).toBe(0)
    expect(listenerCount(element, "animationcancel")).toBe(0)
    expect(vi.getTimerCount()).toBe(0)
  })

  it("returns an idempotent cancellation that never calls hide", () => {
    vi.useFakeTimers()
    const element = document.createElement("div")
    const hide = vi.fn()
    const cancel = hideAfterExit(element, hide)

    cancel()
    cancel()
    vi.runAllTimers()

    expect(hide).not.toHaveBeenCalled()
    expect(listenerCount(element, "animationend")).toBe(0)
    expect(listenerCount(element, "animationcancel")).toBe(0)
    expect(vi.getTimerCount()).toBe(0)
  })

  it("hides synchronously for reduced motion", () => {
    setReducedMotion(true)
    const hide = vi.fn()

    hideAfterExit(document.createElement("div"), hide)()

    expect(hide).toHaveBeenCalledOnce()
  })
})

it("keeps data-open and data-closed mutually exclusive", () => {
  const element = document.createElement("div")

  applyStateAttrs(element, "open")
  expect(element.hasAttribute("data-open")).toBe(true)
  expect(element.hasAttribute("data-closed")).toBe(false)

  applyStateAttrs(element, "closed")
  expect(element.hasAttribute("data-open")).toBe(false)
  expect(element.hasAttribute("data-closed")).toBe(true)
})
