import { describe, expect, it } from "vitest"

import { flushStimulus, mount } from "./support/stimulus.js"

function sidebarRoot(id, state) {
  const staleState = state === "open" ? "closed" : "open"
  return `
    <div id="${id}" data-controller="shadcn--sidebar" data-state="${state}">
      <aside id="${id}-sidebar" data-slot="sidebar" data-state="${staleState}"></aside>
      <button id="${id}-trigger" data-slot="sidebar-trigger" aria-expanded="${state !== "open"}"
              data-action="shadcn--sidebar#toggle">Toggle</button>
      <button id="${id}-second-trigger" data-slot="sidebar-trigger" aria-expanded="${state !== "open"}"
              data-action="shadcn--sidebar#toggle">Toggle again</button>
    </div>
  `
}

describe("shadcn--sidebar", () => {
  it("synchronizes initial state and keeps another root independent", async () => {
    await mount(`${sidebarRoot("closed-root", "closed")}${sidebarRoot("open-root", "open")}`)
    const closedRoot = document.querySelector("#closed-root")
    const openRoot = document.querySelector("#open-root")

    expect(document.querySelector("#closed-root-sidebar").dataset.state).toBe("closed")
    expect(document.querySelector("#closed-root-trigger").getAttribute("aria-expanded")).toBe("false")
    expect(document.querySelector("#open-root-sidebar").dataset.state).toBe("open")
    expect(document.querySelector("#open-root-trigger").getAttribute("aria-expanded")).toBe("true")

    document.querySelector("#closed-root-trigger").click()

    expect(closedRoot.dataset.state).toBe("open")
    expect(document.querySelector("#closed-root-sidebar").dataset.state).toBe("open")
    expect(document.querySelector("#closed-root-trigger").getAttribute("aria-expanded")).toBe("true")
    expect(document.querySelector("#closed-root-second-trigger").getAttribute("aria-expanded")).toBe("true")
    expect(openRoot.dataset.state).toBe("open")
    expect(document.querySelector("#open-root-sidebar").dataset.state).toBe("open")
  })

  it("recomputes descendant state after a Stimulus reconnection", async () => {
    await mount(sidebarRoot("reconnect", "closed"))
    const root = document.querySelector("#reconnect")
    const sidebar = document.querySelector("#reconnect-sidebar")
    const trigger = document.querySelector("#reconnect-trigger")

    root.remove()
    await flushStimulus()
    root.dataset.state = "open"
    sidebar.dataset.state = "closed"
    trigger.setAttribute("aria-expanded", "false")
    document.body.appendChild(root)
    await flushStimulus()

    expect(sidebar.dataset.state).toBe("open")
    expect(trigger.getAttribute("aria-expanded")).toBe("true")
  })
})
