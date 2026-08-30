import { Controller } from "@hotwired/stimulus"

import {
  ensureId,
  ensureRootId,
  ownedElements,
  setDefaultAttribute,
} from "@supermomonga/shadcn-view-components/aria_relationships"

const IDENTIFIER = "shadcn--tabs"

// ARIA tabs パターン(05-stimulus-hotwire §4)。
// - クリック / Enter / Space で選択
// - 左右(縦布局は上下)矢印で roving tabindex による移動
// - 選択状態は data-active(属性の存在)、パネル表示は hidden 属性で表現する
/** @extends {Controller<HTMLElement>} */
export default class TabsController extends Controller {
  connect() {
    this.ensureRelationships()
    const triggers = this.triggers
    if (triggers.length === 0) return
    // サーバ側で active 指定があればそれを、無ければ先頭を採用してパネル表示を同期する
    const active = triggers.find((trigger) => trigger.hasAttribute("data-active")) || triggers[0]
    this.activate(active)
  }

  /** @param {Event} event */
  select(event) {
    const selected = /** @type {HTMLElement} */ (event.currentTarget)
    if (this.triggers.includes(selected)) this.activate(selected)
  }

  /** @param {KeyboardEvent} event */
  navigate(event) {
    const keys = this.vertical ? ["ArrowUp", "ArrowDown"] : ["ArrowLeft", "ArrowRight"]
    if (![...keys, "Home", "End"].includes(event.key)) return
    event.preventDefault()

    const triggers = this.triggers
    const current = triggers.indexOf(/** @type {HTMLElement} */ (event.currentTarget))
    if (current < 0) return

    let next
    if (event.key === "Home") {
      next = triggers[0]
    } else if (event.key === "End") {
      next = triggers[triggers.length - 1]
    } else {
      const offset = event.key === keys[1] ? 1 : -1
      next = triggers[(current + offset + triggers.length) % triggers.length]
    }
    next.focus()
    this.activate(next)
  }

  /** @param {HTMLElement} selected */
  activate(selected) {
    if (!this.triggers.includes(selected)) return

    for (const trigger of this.allTriggers) {
      const active = trigger === selected
      trigger.toggleAttribute("data-active", active)
      trigger.setAttribute("aria-selected", String(active))
      trigger.tabIndex = active ? 0 : -1
    }

    const value = selected.dataset.value
    for (const panel of this.panels) {
      panel.hidden = panel.dataset.value !== value
    }
  }

  ensureRelationships() {
    const rootId = ensureRootId(this.root, "tabs")
    this.validateRelationships()

    for (const [index, trigger] of this.allTriggers.entries()) {
      const panel = this.panels.find((candidate) => candidate.dataset.value === trigger.dataset.value)
      if (!panel) continue

      const triggerId = ensureId(trigger, `${rootId}-trigger-${index + 1}`)
      const panelId = ensureId(panel, `${rootId}-panel-${index + 1}`)
      setDefaultAttribute(trigger, "aria-controls", panelId)
      setDefaultAttribute(panel, "aria-labelledby", triggerId)
      setDefaultAttribute(panel, "tabindex", "0")
    }

    for (const list of this.lists) {
      setDefaultAttribute(list, "aria-orientation", this.vertical ? "vertical" : "horizontal")
    }
  }

  validateRelationships() {
    const triggerCounts = this.valueCounts(this.allTriggers)
    const panelCounts = this.valueCounts(this.panels)
    const values = new Set([...triggerCounts.keys(), ...panelCounts.keys()])

    for (const value of values) {
      if (value === "" || triggerCounts.get(value) !== 1 || panelCounts.get(value) !== 1) {
        throw new Error(`Tabs value ${JSON.stringify(value)} must identify exactly one trigger and one panel`)
      }
    }
  }

  /** @param {HTMLElement[]} elements @returns {Map<string, number>} */
  valueCounts(elements) {
    const counts = new Map()
    for (const element of elements) {
      const value = element.dataset.value || ""
      counts.set(value, (counts.get(value) || 0) + 1)
    }
    return counts
  }

  /** @returns {HTMLElement[]} */
  get triggers() {
    return this.allTriggers.filter(
      (trigger) => !trigger.hasAttribute("disabled") && trigger.getAttribute("aria-disabled") !== "true",
    )
  }

  /** @returns {HTMLElement[]} */
  get allTriggers() {
    return ownedElements(this.root, "[data-slot='tabs-trigger'][role='tab']", IDENTIFIER)
  }

  /** @returns {HTMLElement[]} */
  get panels() {
    return ownedElements(this.root, "[data-slot='tabs-content'][role='tabpanel']", IDENTIFIER)
  }

  /** @returns {HTMLElement[]} */
  get lists() {
    return ownedElements(this.root, "[data-slot='tabs-list'][role='tablist']", IDENTIFIER)
  }

  /** @returns {boolean} */
  get vertical() {
    return this.element.dataset.orientation === "vertical"
  }

  /** @returns {HTMLElement} */
  get root() {
    return /** @type {HTMLElement} */ (this.element)
  }
}
