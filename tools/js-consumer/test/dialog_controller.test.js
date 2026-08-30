import { describe, expect, it, vi } from "vitest"

import { animationEvent } from "./support/browser.js"
import { listenerCount } from "./support/listener_ledger.js"
import { flushStimulus, mount } from "./support/stimulus.js"

function dialogFixture(id, role = "dialog") {
  return `
    <section id="${id}" data-controller="shadcn--dialog">
      <button id="${id}-open" type="button" data-slot="dialog-trigger"
              aria-haspopup="dialog" aria-expanded="false"
              data-action="shadcn--dialog#show">Open</button>
      <dialog id="${id}-dialog" role="${role}">
        <div id="${id}-content" data-slot="dialog-content">
          <h2 data-slot="dialog-title">Title</h2>
          <p data-slot="dialog-description">Description</p>
          <form id="${id}-form"></form>
          <button id="${id}-close" type="button" data-action="shadcn--dialog#close">Close</button>
        </div>
      </dialog>
    </section>
  `
}

describe("shadcn--dialog", () => {
  it("opens, reverses a pending exit, and isolates another root through DOM actions", async () => {
    vi.useFakeTimers()
    const harness = await mount(`${dialogFixture("first")}${dialogFixture("second")}`)
    const firstRoot = document.querySelector("#first")
    const firstDialog = document.querySelector("#first-dialog")
    const firstContent = document.querySelector("#first-content")
    const secondRoot = document.querySelector("#second")
    const secondDialog = document.querySelector("#second-dialog")

    document.querySelector("#first-open").click()
    expect(firstDialog.open).toBe(true)
    expect(firstDialog.hasAttribute("data-open")).toBe(true)
    expect(document.querySelector("#first-open").getAttribute("aria-expanded")).toBe("true")
    expect(document.querySelector("#first-open").getAttribute("aria-controls")).toBe("first-dialog")
    expect(firstDialog.getAttribute("aria-labelledby")).toBe("first-title")
    expect(firstDialog.getAttribute("aria-describedby")).toBe("first-description")
    expect(secondDialog.open).toBe(false)

    document.querySelector("#first-close").click()
    expect(firstDialog.open).toBe(true)
    expect(firstContent.hasAttribute("data-closed")).toBe(true)
    expect(vi.getTimerCount()).toBe(1)

    document.querySelector("#first-open").click()
    expect(firstDialog.open).toBe(true)
    expect(firstContent.hasAttribute("data-open")).toBe(true)
    expect(listenerCount(firstContent, "animationend")).toBe(0)
    expect(listenerCount(firstContent, "animationcancel")).toBe(0)
    expect(vi.getTimerCount()).toBe(0)

    document.querySelector("#first-close").click()
    firstContent.dispatchEvent(animationEvent("animationend", "exit"))
    expect(firstDialog.open).toBe(false)
    expect(secondDialog.open).toBe(false)
    expect(vi.getTimerCount()).toBe(0)

    secondRoot.remove()
    await flushStimulus()
    await harness.disconnect(firstRoot)
  })

  it("closes after Turbo submission and releases listeners and exit resources on disconnect", async () => {
    vi.useFakeTimers()
    const harness = await mount(dialogFixture("cleanup"))
    const root = document.querySelector("#cleanup")
    const dialog = document.querySelector("#cleanup-dialog")
    const content = document.querySelector("#cleanup-content")

    expect(listenerCount(dialog, "close")).toBe(1)
    expect(listenerCount(dialog, "cancel")).toBe(0)
    expect(listenerCount(root, "turbo:submit-end")).toBe(1)

    document.querySelector("#cleanup-open").click()
    document.querySelector("#cleanup-form")
      .dispatchEvent(new Event("turbo:submit-end", { bubbles: true }))
    expect(content.hasAttribute("data-closed")).toBe(true)
    expect(vi.getTimerCount()).toBe(1)

    root.remove()
    await flushStimulus()
    expect(listenerCount(dialog, "close")).toBe(0)
    expect(listenerCount(root, "turbo:submit-end")).toBe(0)
    expect(listenerCount(content, "animationend")).toBe(0)
    expect(listenerCount(content, "animationcancel")).toBe(0)
    expect(vi.getTimerCount()).toBe(0)
    expect(dialog.open).toBe(false)

    document.body.appendChild(root)
    await flushStimulus()
    expect(dialog.open).toBe(false)
    expect(content.hasAttribute("data-closed")).toBe(true)
    expect(document.querySelector("#cleanup-open").getAttribute("aria-expanded")).toBe("false")
    await harness.disconnect(root)
  })

  it("allows the native Escape cancellation for alert dialogs", async () => {
    const harness = await mount(dialogFixture("alert", "alertdialog"))
    const root = document.querySelector("#alert")
    const dialog = document.querySelector("#alert-dialog")
    const event = new Event("cancel", { cancelable: true })

    dialog.dispatchEvent(event)

    expect(event.defaultPrevented).toBe(false)
    await harness.disconnect(root)
  })

  it("preserves consumer IDs and ARIA references", async () => {
    const html = dialogFixture("custom")
      .replace('aria-expanded="false"', 'aria-expanded="false" aria-controls="consumer-content"')
      .replace('id="custom-dialog"', 'id="custom-dialog" aria-labelledby="consumer-title" aria-describedby="consumer-description"')
    const harness = await mount(html)
    const root = document.querySelector("#custom")
    const dialog = document.querySelector("#custom-dialog")

    expect(document.querySelector("#custom-open").getAttribute("aria-controls")).toBe("consumer-content")
    expect(dialog.getAttribute("aria-labelledby")).toBe("consumer-title")
    expect(dialog.getAttribute("aria-describedby")).toBe("consumer-description")
    await harness.disconnect(root)
  })

  it("keeps nested dialog ownership and state isolated", async () => {
    const nested = dialogFixture("outer").replace(
      '<form id="outer-form"></form>',
      `${dialogFixture("inner")}<form id="outer-form"></form>`,
    )
    const harness = await mount(nested)
    const root = document.querySelector("#outer")
    const outerDialog = document.querySelector("#outer-dialog")
    const innerDialog = document.querySelector("#inner-dialog")

    document.querySelector("#outer-open").click()
    document.querySelector("#inner-open").click()
    expect(outerDialog.open).toBe(true)
    expect(innerDialog.open).toBe(true)
    expect(document.querySelector("#outer-open").getAttribute("aria-controls")).toBe("outer-dialog")
    expect(document.querySelector("#inner-open").getAttribute("aria-controls")).toBe("inner-dialog")

    document.querySelector("#inner-close").click()
    innerDialog.querySelector("[data-slot='dialog-content']")
      .dispatchEvent(animationEvent("animationend", "exit"))
    expect(innerDialog.open).toBe(false)
    expect(outerDialog.open).toBe(true)
    expect(document.querySelector("#outer-open").getAttribute("aria-expanded")).toBe("true")
    await harness.disconnect(root)
  })
})
