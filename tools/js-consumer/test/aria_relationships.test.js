import { describe, expect, it } from "vitest"

import {
  ensureId,
  ensureRootId,
  ownedElements,
  setDefaultAttribute,
} from "@supermomonga/shadcn-view-components/aria_relationships"

describe("ARIA relationship helpers", () => {
  it("repairs only duplicated generated roots and keeps user IDs", () => {
    document.body.innerHTML = `
      <section id="cached" data-shadcn-generated-root-id="true"></section>
      <section id="cached" data-shadcn-generated-root-id="true"></section>
      <section id="user-id"></section>
      <section id="user-id"></section>
    `
    const [firstGenerated, secondGenerated, firstUser, secondUser] = document.querySelectorAll("section")

    ensureRootId(firstGenerated, "tabs")
    ensureRootId(secondGenerated, "tabs")
    ensureRootId(firstUser, "tabs")
    ensureRootId(secondUser, "tabs")

    expect(firstGenerated.id).toMatch(/^shadcn-tabs-/)
    expect(firstGenerated.id).not.toBe(secondGenerated.id)
    expect(secondGenerated.id).toBe("cached")
    expect(firstUser.id).toBe("user-id")
    expect(secondUser.id).toBe("user-id")
    document.body.replaceChildren()
  })

  it("updates generated IDs and references while preserving authored values", () => {
    document.body.innerHTML = `
      <div id="taken"></div>
      <button id="authored" aria-controls="authored-popup"></button>
      <button data-shadcn-generated-id="true" data-shadcn-generated-aria-controls="true"></button>
    `
    const authored = document.querySelector("#authored")
    const generated = document.querySelector("button[data-shadcn-generated-id]")

    expect(ensureId(authored, "replacement")).toBe("authored")
    setDefaultAttribute(authored, "aria-controls", "replacement-popup")
    expect(authored.getAttribute("aria-controls")).toBe("authored-popup")

    expect(ensureId(generated, "taken")).toBe("taken-2")
    setDefaultAttribute(generated, "aria-controls", "first-popup")
    setDefaultAttribute(generated, "aria-controls", "second-popup")
    expect(generated.getAttribute("aria-controls")).toBe("second-popup")
    document.body.replaceChildren()
  })

  it("returns only descendants owned by the current nested controller", () => {
    document.body.innerHTML = `
      <section id="outer" data-controller="shadcn--tabs">
        <button data-slot="tabs-trigger">Outer</button>
        <section data-controller="shadcn--tabs">
          <button data-slot="tabs-trigger">Inner</button>
        </section>
      </section>
    `
    const outer = document.querySelector("#outer")

    expect(ownedElements(outer, "[data-slot='tabs-trigger']", "shadcn--tabs").map((item) => item.textContent))
      .toEqual(["Outer"])
    document.body.replaceChildren()
  })
})
