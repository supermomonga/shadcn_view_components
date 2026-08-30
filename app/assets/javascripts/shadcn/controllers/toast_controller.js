import { Controller } from "@hotwired/stimulus"

/**
 * @typedef {object} ToastDetail
 * @property {string=} title
 * @property {string=} description
 * @property {number=} duration
 */

// 通知領域(sonner相当)。shadcn:toast CustomEvent でトーストを追加する:
//   dispatchEvent(new CustomEvent("shadcn:toast", { detail: { title, description } }))
export default class ToastController extends Controller {
  /** @type {Map<HTMLElement, ReturnType<typeof setTimeout>>} */
  timers = new Map()

  /** @type {Set<HTMLElement>} */
  toasts = new Set()

  /** @type {(event: Event) => void} */
  onToast = (event) => {
    if (!("detail" in event)) return
    const customEvent = /** @type {CustomEvent<ToastDetail>} */ (event)
    this.push(customEvent.detail ?? {})
  }

  connect() {
    window.addEventListener("shadcn:toast", this.onToast)
  }

  disconnect() {
    window.removeEventListener("shadcn:toast", this.onToast)
    for (const toast of [...this.toasts]) this.removeToast(toast)
  }

  /** @param {ToastDetail} detail */
  push({ title, description, duration = 4000 }) {
    const toast = document.createElement("article")
    toast.className = "rounded-md border bg-background px-4 py-3 text-sm shadow-lg"
    toast.setAttribute("role", "status")
    if (title) {
      const heading = document.createElement("div")
      heading.className = "font-medium"
      heading.textContent = title
      toast.appendChild(heading)
    }
    if (description) {
      const body = document.createElement("div")
      body.className = "text-muted-foreground"
      body.textContent = description
      toast.appendChild(body)
    }
    this.root.appendChild(toast)
    this.toasts.add(toast)
    if (duration > 0) {
      const timer = setTimeout(() => this.removeToast(toast), duration)
      this.timers.set(toast, timer)
    }
  }

  /** @param {Event} event */
  dismiss(event) {
    if (!(event.currentTarget instanceof Element)) return

    const toast = event.currentTarget.closest("article")
    if (toast) this.removeToast(/** @type {HTMLElement} */ (toast))
  }

  /** @param {HTMLElement} toast */
  removeToast(toast) {
    const timer = this.timers.get(toast)
    if (timer !== undefined) clearTimeout(timer)
    this.timers.delete(toast)
    this.toasts.delete(toast)
    toast.remove()
  }

  /** @returns {HTMLElement} */
  get root() {
    return /** @type {HTMLElement} */ (this.element)
  }
}
