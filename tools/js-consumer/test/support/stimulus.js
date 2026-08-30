import { Application } from "@hotwired/stimulus"
import { register } from "@supermomonga/shadcn-view-components"

const applications = new Set()

export async function flushStimulus() {
  await Promise.resolve()
  await Promise.resolve()
}

export async function mount(html) {
  document.body.innerHTML = html
  const application = Application.start()
  register(application)
  applications.add(application)
  await flushStimulus()

  return {
    application,
    controller(element, identifier) {
      return application.getControllerForElementAndIdentifier(element, identifier)
    },
    async disconnect(element = document.body.firstElementChild) {
      element?.remove()
      await flushStimulus()
      application.stop()
      applications.delete(application)
    },
  }
}

export async function stopApplications() {
  document.body.innerHTML = ""
  await flushStimulus()
  for (const application of applications) application.stop()
  applications.clear()
}
