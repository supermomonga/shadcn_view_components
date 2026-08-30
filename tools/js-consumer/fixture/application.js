import { Application } from "@hotwired/stimulus"
import { register } from "@supermomonga/shadcn-view-components"

const identifiers = []
const application = Application.start()
const registerController = application.register.bind(application)
application.register = (identifier, controller) => {
  identifiers.push(identifier)
  return registerController(identifier, controller)
}
register(application)

document.body.innerHTML = `
  <button
    type="button"
    data-controller="shadcn--toggle"
    data-action="click->shadcn--toggle#toggle"
    data-state="off"
  >Toggle</button>
`
await new Promise((resolve) => setTimeout(resolve, 0))

const toggle = document.querySelector("button")
toggle.click()
await new Promise((resolve) => setTimeout(resolve, 0))

export const consumerResult = {
  identifiers: identifiers.sort(),
  toggleState: toggle.dataset.state,
  togglePressed: toggle.getAttribute("aria-pressed"),
}

application.stop()
