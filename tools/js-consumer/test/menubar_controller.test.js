import { describe, expect, it, vi } from "vitest"

import { listenerCount } from "./support/listener_ledger.js"
import { flushStimulus, mount } from "./support/stimulus.js"

function fixture(id, { nestedRoot = false } = {}) {
  return `
    <div id="${id}" role="menubar" data-controller="shadcn--menubar">
      <div role="none" data-slot="menubar-menu">
        <button id="${id}-file" role="menuitem" data-slot="menubar-trigger"
                aria-haspopup="menu" aria-expanded="false"
                data-action="shadcn--menubar#toggle">File</button>
        <div id="${id}-file-content" role="menu" data-slot="menubar-content"
             popover="auto" data-state="closed">
          <div id="${id}-new" role="menuitem" data-action="shadcn--menubar#activate">New</div>
          ${nestedRoot ? `<section id="${id}-inner" role="none" data-controller="shadcn--menu">
            <button id="${id}-inner-trigger" aria-haspopup="menu" aria-expanded="false"
                    data-action="shadcn--menu#toggle">Inner</button>
            <div id="${id}-inner-content" role="menu" popover="auto" data-state="closed">
              <div role="menuitem" data-action="shadcn--menu#activate">Inner item</div>
            </div>
          </section>` : ""}
          <div data-slot="menubar-sub">
            <div id="${id}-sub-trigger" role="menuitem" data-slot="menubar-sub-trigger"
                    aria-haspopup="menu" aria-expanded="false"
                    data-action="click->shadcn--menubar#toggleSub">Recent</div>
            <div id="${id}-sub-content" role="menu" data-slot="menubar-sub-content"
                 popover="auto" data-state="closed">
              <a id="${id}-recent" role="menuitem" href="#recent"
                 data-action="shadcn--menubar#activate">Recent file</a>
            </div>
          </div>
        </div>
      </div>
      <div role="none" data-slot="menubar-menu">
        <button id="${id}-edit" role="menuitem" data-slot="menubar-trigger"
                aria-haspopup="menu" aria-expanded="false"
                data-action="shadcn--menubar#toggle">Edit</button>
        <div id="${id}-edit-content" role="menu" data-slot="menubar-content"
             popover="auto" data-state="closed">
          <div id="${id}-copy" role="menuitem" data-action="shadcn--menubar#activate">Copy</div>
        </div>
      </div>
    </div>
  `
}

describe("shadcn--menubar", () => {
  it("associates and opens each Menu independently, then switches with horizontal arrows", async () => {
    vi.useFakeTimers()
    const pointerdownBaseline = listenerCount(document, "pointerdown")
    const harness = await mount(fixture("bar"))
    const root = document.querySelector("#bar")
    const file = document.querySelector("#bar-file")
    const edit = document.querySelector("#bar-edit")
    const fileContent = document.querySelector("#bar-file-content")
    const editContent = document.querySelector("#bar-edit-content")

    expect(file.getAttribute("aria-controls")).toBe(fileContent.id)
    expect(fileContent.getAttribute("aria-labelledby")).toBe(file.id)
    expect(edit.getAttribute("aria-controls")).toBe(editContent.id)
    expect(file.tabIndex).toBe(0)
    expect(edit.tabIndex).toBe(-1)
    expect(listenerCount(document, "pointerdown")).toBe(pointerdownBaseline + 1)

    edit.click()
    expect(editContent.dataset.state).toBe("open")
    expect(fileContent.dataset.state).toBe("closed")
    expect(edit.getAttribute("aria-expanded")).toBe("true")
    expect(file.getAttribute("aria-expanded")).toBe("false")
    expect(document.activeElement).toBe(document.querySelector("#bar-copy"))

    edit.click()
    expect(editContent.dataset.state).toBe("closed")
    edit.click()
    expect(editContent.dataset.state).toBe("open")

    edit.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "ArrowLeft" }))
    expect(fileContent.dataset.state).toBe("open")
    expect(editContent.dataset.state).toBe("closed")
    expect(document.activeElement).toBe(document.querySelector("#bar-new"))
    expect(file.tabIndex).toBe(0)
    expect(edit.tabIndex).toBe(-1)

    document.querySelector("#bar-new").dispatchEvent(
      new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "Escape" }),
    )
    expect(fileContent.dataset.state).toBe("closed")
    expect(document.activeElement).toBe(file)

    await harness.disconnect(root)
    expect(listenerCount(document, "pointerdown")).toBe(pointerdownBaseline)
  })

  it("closes one submenu level on Escape and closes all levels on outside pointerdown", async () => {
    vi.useFakeTimers()
    const harness = await mount(fixture("nested-bar"))
    const root = document.querySelector("#nested-bar")
    const content = document.querySelector("#nested-bar-file-content")
    const submenuTrigger = document.querySelector("#nested-bar-sub-trigger")
    const submenu = document.querySelector("#nested-bar-sub-content")
    const recent = document.querySelector("#nested-bar-recent")

    document.querySelector("#nested-bar-file").click()
    submenuTrigger.click()
    expect(document.activeElement).toBe(recent)

    recent.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "Escape" }))
    expect(submenu.dataset.state).toBe("closed")
    expect(content.dataset.state).toBe("open")
    expect(document.activeElement).toBe(submenuTrigger)

    submenuTrigger.click()
    const focusedBeforeOutside = document.activeElement
    document.body.dispatchEvent(new Event("pointerdown", { bubbles: true }))
    expect(submenu.dataset.state).toBe("closed")
    expect(content.dataset.state).toBe("closed")
    expect(document.activeElement).toBe(focusedBeforeOutside)

    await harness.disconnect(root)
  })

  it("activates default div items with Enter and Space", async () => {
    vi.useFakeTimers()
    const harness = await mount(fixture("keyboard-bar"))
    const root = document.querySelector("#keyboard-bar")
    const trigger = document.querySelector("#keyboard-bar-file")
    const content = document.querySelector("#keyboard-bar-file-content")
    const item = document.querySelector("#keyboard-bar-new")
    const onActivate = vi.fn()
    item.addEventListener("click", onActivate)

    trigger.click()
    item.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "Enter" }))
    expect(onActivate).toHaveBeenCalledTimes(1)
    expect(content.dataset.state).toBe("closed")

    trigger.click()
    item.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: " " }))
    expect(onActivate).toHaveBeenCalledTimes(2)
    expect(content.dataset.state).toBe("closed")
    await harness.disconnect(root)
  })

  it("closes the open branch on Tab or focus returning to its Trigger", async () => {
    vi.useFakeTimers()
    const harness = await mount(`<button id="before-focus-bar">Before</button>${fixture("focus-bar")}`)
    const root = document.querySelector("#focus-bar")
    const before = document.querySelector("#before-focus-bar")
    const trigger = document.querySelector("#focus-bar-file")
    const content = document.querySelector("#focus-bar-file-content")
    const item = document.querySelector("#focus-bar-new")

    trigger.click()
    item.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "Tab" }))
    expect(content.dataset.state).toBe("closed")
    expect(trigger.tabIndex).toBe(-1)
    before.focus()
    expect(document.activeElement).toBe(before)
    vi.runOnlyPendingTimers()
    expect(trigger.tabIndex).toBe(0)

    trigger.click()
    trigger.focus()
    expect(content.dataset.state).toBe("closed")
    await harness.disconnect(root)
  })

  it("does not restore a stale top-level tab stop after another Menu takes ownership", async () => {
    vi.useFakeTimers()
    const harness = await mount(fixture("owner-bar"))
    const root = document.querySelector("#owner-bar")
    const file = document.querySelector("#owner-bar-file")
    const edit = document.querySelector("#owner-bar-edit")
    const fileItem = document.querySelector("#owner-bar-new")
    const editContent = document.querySelector("#owner-bar-edit-content")

    file.click()
    fileItem.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "Tab" }))
    edit.click()
    vi.runOnlyPendingTimers()

    expect(editContent.dataset.state).toBe("open")
    expect(file.tabIndex).toBe(-1)
    expect(edit.tabIndex).toBe(0)
    await harness.disconnect(root)
  })

  it("cancels a pending tab-stop restoration across disconnect and reconnect", async () => {
    vi.useFakeTimers()
    const harness = await mount(fixture("reconnect-bar"))
    const root = document.querySelector("#reconnect-bar")
    const trigger = document.querySelector("#reconnect-bar-file")
    const item = document.querySelector("#reconnect-bar-new")
    const controller = harness.controller(root, "shadcn--menubar")

    trigger.click()
    item.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "Tab" }))
    expect(controller.restoreTopTriggerTimer).not.toBeNull()

    root.remove()
    await flushStimulus()
    expect(controller.restoreTopTriggerTimer).toBeNull()

    document.body.append(root)
    await flushStimulus()
    vi.runOnlyPendingTimers()
    expect([...root.querySelectorAll("[data-slot='menubar-trigger']")]
      .filter((candidate) => candidate.tabIndex === 0)).toHaveLength(1)
    await harness.disconnect(root)
  })

  it("keeps a nested menu with its open parent and closes it when the parent changes branch", async () => {
    vi.useFakeTimers()
    const harness = await mount(fixture("nested-root-bar", { nestedRoot: true }))
    const root = document.querySelector("#nested-root-bar")
    const fileContent = document.querySelector("#nested-root-bar-file-content")
    const editContent = document.querySelector("#nested-root-bar-edit-content")
    const innerContent = document.querySelector("#nested-root-bar-inner-content")

    document.querySelector("#nested-root-bar-file").click()
    document.querySelector("#nested-root-bar-inner-trigger").click()
    expect(fileContent.dataset.state).toBe("open")
    expect(innerContent.dataset.state).toBe("open")

    document.querySelector("#nested-root-bar-file").click()
    expect(fileContent.dataset.state).toBe("closed")
    expect(innerContent.dataset.state).toBe("closed")

    document.querySelector("#nested-root-bar-file").click()
    document.querySelector("#nested-root-bar-inner-trigger").click()
    document.querySelector("#nested-root-bar-edit").click()
    expect(fileContent.dataset.state).toBe("closed")
    expect(innerContent.dataset.state).toBe("closed")
    expect(editContent.dataset.state).toBe("open")
    await harness.disconnect(root)
  })
})
