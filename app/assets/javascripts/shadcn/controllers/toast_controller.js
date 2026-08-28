import { Controller } from "@hotwired/stimulus"

// 通知領域(sonner相当)。shadcn:toast CustomEvent でトーストを追加する:
//   dispatchEvent(new CustomEvent("shadcn:toast", { detail: { title, description } }))
export default class ToastController extends Controller {
  connect() {
    this.onToast = (event) => this.push(event.detail ?? {})
    window.addEventListener("shadcn:toast", this.onToast)
  }

  disconnect() {
    window.removeEventListener("shadcn:toast", this.onToast)
  }

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
    this.element.appendChild(toast)
    if (duration > 0) setTimeout(() => toast.remove(), duration)
  }

  dismiss(event) {
    event.currentTarget.closest("article")?.remove()
  }
}
