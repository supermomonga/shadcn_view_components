import { describe, expect, it } from "vitest"

import { flushStimulus, mount } from "./support/stimulus.js"

function sliderRoot({
  id,
  max = "100",
  min = "0",
  orientation = "horizontal",
  step = "1",
  value = "50",
}) {
  return `
    <div id="${id}" data-controller="shadcn--slider" data-slot="slider"
         data-orientation="${orientation}">
      <div data-slot="slider-track">
        <div data-slot="slider-range" data-orientation="${orientation}"></div>
      </div>
      <span data-slot="slider-thumb" data-orientation="${orientation}"></span>
      <input type="range" data-slot="slider-input"
             min="${min}" max="${max}" step="${step}" value="${value}"
             data-action="input->shadcn--slider#sync change->shadcn--slider#sync">
    </div>
  `
}

function elements(id) {
  const root = document.querySelector(`#${id}`)
  return {
    input: root.querySelector("[data-slot='slider-input']"),
    range: root.querySelector("[data-slot='slider-range']"),
    root,
    thumb: root.querySelector("[data-slot='slider-thumb']"),
  }
}

describe("shadcn--slider", () => {
  it("synchronizes the horizontal decoration on connect, input, and change", async () => {
    await mount(sliderRoot({ id: "volume", min: "10", max: "50", step: "5", value: "20" }))
    const { input, range, thumb } = elements("volume")

    expect(range.style.width).toBe("25%")
    expect(range.style.height).toBe("")
    expect(thumb.style.left).toBe("25%")
    expect(thumb.style.bottom).toBe("")

    input.value = "40"
    input.dispatchEvent(new Event("input", { bubbles: true }))
    expect(range.style.width).toBe("75%")
    expect(thumb.style.left).toBe("75%")

    input.value = "50"
    input.dispatchEvent(new Event("change", { bubbles: true }))
    expect(range.style.width).toBe("100%")
    expect(thumb.style.left).toBe("100%")
  })

  it("uses height and bottom for a vertical slider and keeps the thumb centered", async () => {
    await mount(sliderRoot({
      id: "temperature",
      orientation: "vertical",
      min: "-10",
      max: "30",
      step: "2",
      value: "10",
    }))
    const { input, range, thumb } = elements("temperature")
    range.style.width = "91%"
    thumb.style.left = "91%"

    input.dispatchEvent(new Event("input", { bubbles: true }))

    expect(range.style.height).toBe("50%")
    expect(range.style.width).toBe("")
    expect(thumb.style.bottom).toBe("50%")
    expect(thumb.style.left).toBe("50%")
  })

  it("clamps the decoration to the input bounds without replacing native step behavior", async () => {
    await mount(sliderRoot({ id: "decimal", min: "-1", max: "1", step: "0.25", value: "-0.5" }))
    const { input, range, thumb } = elements("decimal")

    expect(input.step).toBe("0.25")
    expect(range.style.width).toBe("25%")

    input.value = "5"
    input.dispatchEvent(new Event("input", { bubbles: true }))
    expect(input.valueAsNumber).toBe(1)
    expect(range.style.width).toBe("100%")
    expect(thumb.style.left).toBe("100%")

    const keydown = new KeyboardEvent("keydown", {
      bubbles: true,
      cancelable: true,
      key: "ArrowLeft",
    })
    input.dispatchEvent(keydown)
    expect(keydown.defaultPrevented).toBe(false)
    expect(range.style.width).toBe("100%")
  })

  it("reflects the native midpoint when range attributes are omitted", async () => {
    await mount(`
      <div id="native-defaults" data-controller="shadcn--slider" data-slot="slider"
           data-orientation="horizontal">
        <div data-slot="slider-range"></div>
        <span data-slot="slider-thumb"></span>
        <input type="range" data-slot="slider-input"
               data-action="input->shadcn--slider#sync change->shadcn--slider#sync">
      </div>
    `)
    const { input, range, thumb } = elements("native-defaults")

    expect(input.valueAsNumber).toBe(50)
    expect(range.style.width).toBe("50%")
    expect(thumb.style.left).toBe("50%")
  })

  it("isolates nested roots and restores the current input value after reconnect", async () => {
    const lifecycle = await mount(`
      <div id="outer" data-controller="shadcn--slider" data-slot="slider" data-orientation="horizontal">
        <div data-slot="slider-range"></div>
        <span data-slot="slider-thumb"></span>
        <input type="range" data-slot="slider-input" min="0" max="100" value="20"
               data-action="input->shadcn--slider#sync change->shadcn--slider#sync">
        ${sliderRoot({ id: "inner", value: "80" })}
      </div>
    `)
    const outer = elements("outer")
    const inner = elements("inner")

    expect(outer.range.style.width).toBe("20%")
    expect(inner.range.style.width).toBe("80%")

    inner.input.value = "30"
    inner.input.dispatchEvent(new Event("input", { bubbles: true }))
    expect(inner.range.style.width).toBe("30%")
    expect(outer.range.style.width).toBe("20%")

    const controller = lifecycle.controller(outer.root, "shadcn--slider")
    outer.root.remove()
    await flushStimulus()
    outer.input.value = "70"
    document.body.append(outer.root)
    await flushStimulus()

    expect(lifecycle.controller(outer.root, "shadcn--slider")).toBe(controller)
    expect(outer.range.style.width).toBe("70%")
    expect(outer.thumb.style.left).toBe("70%")
  })
})
