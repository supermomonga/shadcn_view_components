import { readdir } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

import { expect, it } from "vitest"

const testRoot = path.dirname(fileURLToPath(import.meta.url))
const controllerRoot = path.join(testRoot, "../fixture/vendor/shadcn-view-components/controllers")

it("keeps one DOM unit test file for every distributed controller", async () => {
  const controllerNames = (await readdir(controllerRoot))
    .filter((name) => name.endsWith("_controller.js"))
    .map((name) => name.replace(/\.js$/, ".test.js"))
    .sort()
  const testNames = (await readdir(testRoot))
    .filter((name) => name.endsWith("_controller.test.js"))
    .sort()

  expect(testNames).toEqual(controllerNames)
})
