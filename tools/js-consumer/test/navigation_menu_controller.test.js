import { describe, expect, it, vi } from "vitest"

import { listenerCount } from "./support/listener_ledger.js"
import { mount } from "./support/stimulus.js"

function fixture(id) {
  return `
    <nav id="${id}" data-controller="shadcn--navigation-menu">
      <ul data-slot="navigation-menu-list">
        <li data-slot="navigation-menu-item">
          <a id="${id}-home" data-slot="navigation-menu-link" href="#home">Home</a>
        </li>
        <li data-slot="navigation-menu-item">
          <button id="${id}-docs" data-slot="navigation-menu-trigger" aria-expanded="false"
                  data-action="shadcn--navigation-menu#toggle">Docs</button>
          <div id="${id}-docs-content" data-slot="navigation-menu-content"
               popover="auto" data-state="closed">
            <a id="${id}-intro" data-slot="navigation-menu-link" href="#intro">Introduction</a>
            <a id="${id}-install" data-slot="navigation-menu-link" href="#install">Installation</a>
          </div>
        </li>
        <li data-slot="navigation-menu-item">
          <button id="${id}-guides" data-slot="navigation-menu-trigger" aria-expanded="false"
                  data-action="shadcn--navigation-menu#toggle">Guides</button>
          <div id="${id}-guides-content" data-slot="navigation-menu-content"
               popover="auto" data-state="closed">
            <a id="${id}-rails" data-slot="navigation-menu-link" href="#rails">Rails</a>
          </div>
        </li>
      </ul>
    </nav>
  `
}

describe("shadcn--navigation-menu", () => {
  it("pairs multiple Items and preserves native links while navigating their contents", async () => {
    vi.useFakeTimers()
    const harness = await mount(fixture("nav"))
    const root = document.querySelector("#nav")
    const docs = document.querySelector("#nav-docs")
    const guides = document.querySelector("#nav-guides")
    const docsContent = document.querySelector("#nav-docs-content")
    const guidesContent = document.querySelector("#nav-guides-content")

    expect(docs.getAttribute("aria-controls")).toBe(docsContent.id)
    expect(docsContent.getAttribute("aria-labelledby")).toBe(null)
    expect(guides.getAttribute("aria-controls")).toBe(guidesContent.id)
    expect(document.querySelector("#nav-home").getAttribute("role")).toBe(null)

    guides.click()
    expect(guidesContent.dataset.state).toBe("open")
    expect(docsContent.dataset.state).toBe("closed")
    expect(guides.hasAttribute("data-popup-open")).toBe(true)

    guides.click()
    expect(guidesContent.dataset.state).toBe("closed")
    guides.click()
    expect(guidesContent.dataset.state).toBe("open")

    guides.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "ArrowDown" }))
    expect(document.activeElement).toBe(document.querySelector("#nav-rails"))

    document.querySelector("#nav-rails").dispatchEvent(
      new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "Escape" }),
    )
    expect(guidesContent.dataset.state).toBe("closed")
    expect(document.activeElement).toBe(guides)

    docs.click()
    docs.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "ArrowDown" }))
    expect(document.activeElement).toBe(document.querySelector("#nav-intro"))
    document.querySelector("#nav-intro").dispatchEvent(
      new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "ArrowDown" }),
    )
    expect(document.activeElement).toBe(document.querySelector("#nav-install"))

    document.querySelector("#nav-install").click()
    expect(docsContent.dataset.state).toBe("closed")
    await harness.disconnect(root)
  })

  it("switches an open Item with horizontal arrows and closes it on outside pointerdown", async () => {
    vi.useFakeTimers()
    const pointerdownBaseline = listenerCount(document, "pointerdown")
    const harness = await mount(fixture("switch-nav"))
    const root = document.querySelector("#switch-nav")
    const docs = document.querySelector("#switch-nav-docs")
    const guides = document.querySelector("#switch-nav-guides")
    const docsContent = document.querySelector("#switch-nav-docs-content")
    const guidesContent = document.querySelector("#switch-nav-guides-content")

    docs.click()
    docs.focus()
    docs.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "ArrowRight" }))
    expect(document.activeElement).toBe(guides)
    expect(docsContent.dataset.state).toBe("closed")
    expect(guidesContent.dataset.state).toBe("open")

    const focusedBeforeOutside = document.activeElement
    document.body.dispatchEvent(new Event("pointerdown", { bubbles: true }))
    expect(guidesContent.dataset.state).toBe("closed")
    expect(document.activeElement).toBe(focusedBeforeOutside)

    await harness.disconnect(root)
    expect(listenerCount(document, "pointerdown")).toBe(pointerdownBaseline)
  })

  it("keeps native Tab traversal inside Content and closes when focus returns to its Trigger", async () => {
    vi.useFakeTimers()
    const harness = await mount(fixture("focus-nav"))
    const root = document.querySelector("#focus-nav")
    const trigger = document.querySelector("#focus-nav-docs")
    const content = document.querySelector("#focus-nav-docs-content")
    const intro = document.querySelector("#focus-nav-intro")
    const install = document.querySelector("#focus-nav-install")

    trigger.click()
    intro.focus()
    install.focus()
    expect(content.dataset.state).toBe("open")

    trigger.focus()
    expect(content.dataset.state).toBe("closed")
    await harness.disconnect(root)
  })
})
