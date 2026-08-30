import { describe, expect, it, vi } from "vitest"

import { animationEvent } from "./support/browser.js"
import { listenerCount } from "./support/listener_ledger.js"
import { flushStimulus, mount } from "./support/stimulus.js"

function dialogFixture(id, role = "dialog") {
  return `
    <section id="${id}" data-controller="shadcn--dialog">
      <button id="${id}-open" type="button" aria-haspopup="dialog" aria-expanded="false"
              data-action="shadcn--dialog#show">Open</button>
      <dialog id="${id}-dialog" role="${role}">
        <div id="${id}-content" data-slot="dialog-content">
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
    expect(listenerCount(dialog, "cancel")).toBe(1)
    expect(listenerCount(root, "turbo:submit-end")).toBe(1)

    document.querySelector("#cleanup-open").click()
    document.querySelector("#cleanup-form")
      .dispatchEvent(new Event("turbo:submit-end", { bubbles: true }))
    expect(content.hasAttribute("data-closed")).toBe(true)
    expect(vi.getTimerCount()).toBe(1)

    root.remove()
    await flushStimulus()
    expect(listenerCount(dialog, "close")).toBe(0)
    expect(listenerCount(dialog, "cancel")).toBe(0)
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

  it("prevents native cancel for alert dialogs", async () => {
    const harness = await mount(dialogFixture("alert", "alertdialog"))
    const root = document.querySelector("#alert")
    const dialog = document.querySelector("#alert-dialog")
    const event = new Event("cancel", { cancelable: true })

    dialog.dispatchEvent(event)

    expect(event.defaultPrevented).toBe(true)
    await harness.disconnect(root)
  })
})
