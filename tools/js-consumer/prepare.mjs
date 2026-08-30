import { cp, mkdir, rm } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

const toolRoot = path.dirname(fileURLToPath(import.meta.url))
const source = path.resolve(toolRoot, "../../app/assets/javascripts/shadcn")
const destination = path.join(toolRoot, "fixture/vendor/shadcn-view-components")

await rm(destination, { recursive: true, force: true })
await mkdir(path.dirname(destination), { recursive: true })
await cp(source, destination, { recursive: true })
