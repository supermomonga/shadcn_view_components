import { describe, expect, it } from "vitest"

import { mount } from "./support/stimulus.js"

function calendarFixture(id, { labelledby, selectedIndex = 3 } = {}) {
  const days = Array.from({ length: 14 }, (_, index) => {
    const selected = index === selectedIndex
    return `<td role="gridcell" aria-selected="${selected}">
      <button type="button" data-slot="calendar-day-button" data-day="2026-08-${String(index + 1).padStart(2, "0")}"
              tabindex="${selected ? 0 : -1}">${index + 1}</button>
    </td>`
  })
  const rows = [days.slice(0, 7), days.slice(7)]
    .map((week) => `<tr>${week.join("")}</tr>`)
    .join("")
  return `
    <section id="${id}" data-controller="shadcn--calendar"
             data-action="keydown->shadcn--calendar#navigate"
             data-shadcn-generated-root-id="true">
      <div id="${id}-caption" data-slot="calendar-caption" data-shadcn-generated-id="true">2026年8月</div>
      <table id="${id}-grid" data-slot="calendar-grid" data-shadcn-generated-id="true"
             role="grid" ${labelledby ? `aria-labelledby="${labelledby}"` : ""}>
        <tbody>${rows}</tbody>
      </table>
    </section>
  `
}

function keydown(element, key) {
  const event = new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key })
  element.dispatchEvent(event)
  return event
}

describe("shadcn--calendar", () => {
  it("keeps one roving tab stop and moves within the displayed grid", async () => {
    const lifecycle = await mount(calendarFixture("calendar"))
    const root = document.querySelector("#calendar")
    const grid = root.querySelector("[data-slot='calendar-grid']")
    const caption = root.querySelector("[data-slot='calendar-caption']")
    const days = [...root.querySelectorAll("[data-slot='calendar-day-button']")]

    expect(grid.getAttribute("aria-labelledby")).toBe(caption.id)
    expect(days.filter((day) => day.tabIndex === 0)).toEqual([days[3]])

    days[3].focus()
    expect(keydown(days[3], "ArrowRight").defaultPrevented).toBe(true)
    expect(document.activeElement).toBe(days[4])
    keydown(days[4], "ArrowDown")
    expect(document.activeElement).toBe(days[11])
    keydown(days[11], "Home")
    expect(document.activeElement).toBe(days[7])
    keydown(days[7], "End")
    expect(document.activeElement).toBe(days[13])
    expect(days.filter((day) => day.tabIndex === 0)).toEqual([days[13]])

    keydown(days[13], "ArrowRight")
    expect(document.activeElement).toBe(days[13])
    expect(days.filter((day) => day.tabIndex === 0)).toEqual([days[13]])

    await lifecycle.disconnect(root)
  })

  it("repairs cached generated-ID collisions and preserves a user ARIA reference", async () => {
    const lifecycle = await mount(`
      ${calendarFixture("cached")}
      ${calendarFixture("cached")}
      <div id="user-calendar-label">利用者ラベル</div>
      ${calendarFixture("custom", { labelledby: "user-calendar-label" })}
    `)
    const roots = [...document.querySelectorAll("[data-controller='shadcn--calendar']")]
    const ids = [...document.querySelectorAll("[id]")].map((element) => element.id)
    const customGrid = document.querySelector("#custom [data-slot='calendar-grid']")

    expect(new Set(ids).size).toBe(ids.length)
    for (const root of roots.slice(0, 2)) {
      const caption = root.querySelector("[data-slot='calendar-caption']")
      const grid = root.querySelector("[data-slot='calendar-grid']")
      expect(grid.getAttribute("aria-labelledby")).toBe(caption.id)
    }
    expect(customGrid.getAttribute("aria-labelledby")).toBe("user-calendar-label")

    await lifecycle.disconnect(roots[0])
  })
})
