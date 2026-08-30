import { Controller } from "@hotwired/stimulus"

import {
  ensureId,
  ensureRootId,
  ownedElements,
} from "@supermomonga/shadcn-view-components/aria_relationships"

const CONTROLLER = "shadcn--calendar"
const DAY_SELECTOR = "[data-slot='calendar-day-button']"

// サーバ描画済みの同一月grid内でroving tabindexを管理する。
// 月をまたぐ移動はURL/I18n/選択APIと一体で設計する必要があるため、このcontrollerは
// 現在表示されている42日分の範囲を越えてフォーカスを移動しない。
/** @extends {Controller<HTMLElement>} */
export default class CalendarController extends Controller {
  connect() {
    this.ensureRelationships()
    this.normalizeTabStop()
  }

  /** @param {KeyboardEvent} event */
  navigate(event) {
    const target = event.target instanceof Element ? event.target.closest(DAY_SELECTOR) : null
    if (!(target instanceof HTMLElement) || !this.days.includes(target)) return

    const keys = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"]
    if (!keys.includes(event.key)) return
    event.preventDefault()

    let destination
    if (event.key === "Home" || event.key === "End") {
      const row = target.closest("tr")
      const rowDays = row ? this.days.filter((day) => row.contains(day)) : []
      destination = event.key === "Home" ? rowDays[0] : rowDays.at(-1)
    } else {
      let offset = 0
      if (event.key === "ArrowLeft") offset = -1
      else if (event.key === "ArrowRight") offset = 1
      else if (event.key === "ArrowUp") offset = -7
      else if (event.key === "ArrowDown") offset = 7
      const index = this.days.indexOf(target) + offset
      destination = this.days[index]
    }

    if (destination) this.focusDay(destination)
  }

  ensureRelationships() {
    const rootId = ensureRootId(this.element, "calendar")
    const caption = this.caption
    const grid = this.grid
    if (!caption || !grid) return

    const previousCaptionId = caption.id
    ensureId(caption, `${rootId}-caption`)
    ensureId(grid, `${rootId}-grid`)
    if (!grid.hasAttribute("aria-labelledby") || grid.getAttribute("aria-labelledby") === previousCaptionId) {
      grid.setAttribute("aria-labelledby", caption.id)
    }
  }

  normalizeTabStop() {
    const days = this.days
    if (days.length === 0) return

    const current = days.filter((day) => day.tabIndex === 0)
    const selected = days.find((day) => day.closest("[role='gridcell']")?.getAttribute("aria-selected") === "true")
    const today = days.find((day) => day.getAttribute("aria-current") === "date")
    this.setTabStop(current.length === 1 ? current[0] : selected || today || days[0])
  }

  /** @param {HTMLElement} day */
  focusDay(day) {
    this.setTabStop(day)
    day.focus()
  }

  /** @param {HTMLElement} active */
  setTabStop(active) {
    for (const day of this.days) day.tabIndex = day === active ? 0 : -1
  }

  /** @returns {HTMLElement[]} */
  get days() {
    return ownedElements(this.element, DAY_SELECTOR, CONTROLLER)
  }

  /** @returns {HTMLElement | null} */
  get caption() {
    return ownedElements(this.element, "[data-slot='calendar-caption']", CONTROLLER)[0] ?? null
  }

  /** @returns {HTMLElement | null} */
  get grid() {
    return ownedElements(this.element, "[data-slot='calendar-grid']", CONTROLLER)[0] ?? null
  }
}
