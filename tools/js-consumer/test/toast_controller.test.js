import { describe, expect, it, vi } from "vitest"

import { flushStimulus, mount } from "./support/stimulus.js"

function toastFixture(id) {
  return `<ol id="${id}" data-controller="shadcn--toast"></ol>`
}

function dispatchToast(detail) {
  window.dispatchEvent(new CustomEvent("shadcn:toast", { detail }))
}

describe("shadcn--toast", () => {
  it("delivers to separate roots and clears one toast timer through its dismiss action", async () => {
    vi.useFakeTimers()
    const harness = await mount(`${toastFixture("first")}${toastFixture("second")}`)
    const firstRoot = document.querySelector("#first")
    const secondRoot = document.querySelector("#second")

    dispatchToast({ title: "Saved", description: "Complete", duration: 100 })
    const firstToast = firstRoot.querySelector("article")
    const secondToast = secondRoot.querySelector("article")
    expect(firstToast.textContent).toContain("Saved")
    expect(firstToast.textContent).toContain("Complete")
    expect(secondToast).not.toBeNull()
    expect(vi.getTimerCount()).toBe(2)

    const dismiss = document.createElement("button")
    dismiss.type = "button"
    dismiss.dataset.action = "shadcn--toast#dismiss"
    firstToast.appendChild(dismiss)
    await flushStimulus()
    dismiss.click()
    expect(firstRoot.querySelector("article")).toBeNull()
    expect(secondRoot.querySelector("article")).toBe(secondToast)
    expect(vi.getTimerCount()).toBe(1)

    vi.advanceTimersByTime(100)
    expect(secondRoot.querySelector("article")).toBeNull()
    expect(vi.getTimerCount()).toBe(0)
    secondRoot.remove()
    await flushStimulus()
    await harness.disconnect(firstRoot)
  })

  it("removes created toasts and releases window listener and timers on disconnect", async () => {
    vi.useFakeTimers()
    const harness = await mount(toastFixture("cleanup"))
    const root = document.querySelector("#cleanup")

    vi.clearAllTimers()
    dispatchToast({ title: "Pending", duration: 4000 })
    expect(root.querySelector("article")).not.toBeNull()
    expect(vi.getTimerCount()).toBe(1)

    await harness.disconnect(root)
    expect(root.querySelector("article")).toBeNull()
    expect(vi.getTimerCount()).toBe(0)

    dispatchToast({ title: "After disconnect", duration: 4000 })
    expect(root.querySelector("article")).toBeNull()
    expect(vi.getTimerCount()).toBe(0)
  })
})
