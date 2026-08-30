import { afterEach, vi } from "vitest"

import { installBrowserShims, resetBrowserShims } from "./support/browser.js"
import { installListenerLedger } from "./support/listener_ledger.js"
import { stopApplications } from "./support/stimulus.js"

installBrowserShims()
installListenerLedger()

afterEach(async () => {
  await stopApplications()
  vi.clearAllTimers()
  vi.useRealTimers()
  resetBrowserShims()
})
