import { describe, expect, it } from "vitest"

import { parseTsx } from "../parse/ast.ts"
import { extractCvaDefinitions } from "../parse/cva.ts"
import { analyzeCn } from "../parse/cn.ts"
import { discoverExports } from "../parse/context.ts"
import { collectSlots } from "../parse/slots.ts"
import { resolveCnCombinations } from "../derive/combinations.ts"
import { renderContractRuby } from "../emit/ruby.ts"
import { renderThemeCss } from "../emit/css.ts"
import type { Contract } from "../contract.ts"

/**
 * 簡退化させた固定フィクスチャTSX(03-extraction-codegen §9)。
 * リファクタしても抽出結果が変わらないことの保証に使う。
 */
const FIXTURE_BUTTON_TSX = `
import { cva } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        outline: "border bg-background hover:bg-accent",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
      },
    },
    compoundVariants: [{ variant: "outline", size: "sm", class: "text-xs" }],
    defaultVariants: { variant: "default", size: "default" },
  }
)

function Button({ className, variant = "default", size = "default", ...props }) {
  return (
    <button
      data-slot="button"
      data-variant={variant}
      aria-pressed={false}
      type="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
`

describe("parse: cva", () => {
  it("extracts base, variants, compound and defaults", () => {
    const ast = parseTsx(FIXTURE_BUTTON_TSX)
    const definitions = extractCvaDefinitions(ast, "button", "ui/button.tsx")
    expect(definitions.size).toBe(1)
    const def = definitions.get("buttonVariants")!
    expect(def.base).toBe("inline-flex items-center justify-center rounded-md text-sm font-medium")
    expect(Object.keys(def.variants)).toEqual(["variant", "size"])
    expect(def.variants.variant!.outline).toBe("border bg-background hover:bg-accent")
    expect(def.compound).toEqual([{ when: { variant: "outline", size: "sm" }, class: "text-xs" }])
    expect(def.defaults).toEqual({ variant: "default", size: "default" })
  })

  it("rejects dynamic (template expression) base strings", () => {
    const ast = parseTsx(`const v = cva(\`base-\${dynamic}\`, {})`)
    expect(() => extractCvaDefinitions(ast, "button", "ui/button.tsx")).toThrow(/static string/)
  })
})

describe("parse: exports and slots", () => {
  it("binds JSX elements to the Button export and collects data-slot structure", () => {
    const ast = parseTsx(FIXTURE_BUTTON_TSX)
    const exports = discoverExports(ast, "button", "ui/button.tsx")
    expect(exports.map((entry) => entry.name).sort()).toEqual(["Button", "buttonVariants"])

    const button = exports.find((entry) => entry.name === "Button")!
    expect(button.functionNode).not.toBeNull()

    const slots = collectSlots(ast, button.functionNode!, "button", "ui/button.tsx")
    expect(slots.rootSlot).toBe("button")
    expect(slots.rootTag).toBe("button")
    expect(slots.slots).toEqual([
      {
        name: "button",
        tag: "button",
        static_attributes: { type: "button" },
        dynamic_attributes: ["aria-pressed", "data-variant"],
      },
    ])
  })

  it("allows a root element without data-slot (spinner等のアイコン系) and records it as name: \"\"", () => {
    const ast = parseTsx(`function X() { return <div className="x" /> }\nexport { X }`)
    const exports = discoverExports(ast, "x", "ui/x.tsx")
    const slots = collectSlots(ast, exports[0]!.functionNode!, "x", "ui/x.tsx")
    expect(slots.rootSlot).toBe("")
    expect(slots.slots).toEqual([{ name: "", tag: "div", static_attributes: {class: "x"}, dynamic_attributes: [] }])
  })

  it("resolves swapped native tags (Comp = asChild ? Slot.Root : \"button\")", () => {
    const code = `
      function Button() {
        const Comp = false ? Slot.Root : "button"
        return <Comp data-slot="button" className="x" />
      }
      export { Button }
    `
    const ast = parseTsx(code)
    const exports = discoverExports(ast, "button", "ui/button.tsx")
    const slots = collectSlots(ast, exports[0]!.functionNode!, "button", "ui/button.tsx")
    expect(slots.rootTag).toBe("button")
  })
})

describe("parse: cn", () => {
  it("classifies cva references, static strings and user className", () => {
    const ast = parseTsx(FIXTURE_BUTTON_TSX)
    const definitions = extractCvaDefinitions(ast, "button", "ui/button.tsx")
    const exports = discoverExports(ast, "button", "ui/button.tsx")
    const button = exports.find((entry) => entry.name === "Button")!
    const analysis = analyzeCn(ast, button.functionNode!, definitions, "button", "ui/button.tsx")
    expect(analysis.calls.length).toBe(1)
    const call = analysis.calls[0]!
    expect(call.slot).toBe("button")
    expect(call.cvaRef).toBe("buttonVariants")
    expect(call.cvaProps.sort()).toEqual(["size", "variant"])
    expect(call.statics).toEqual([])
    expect(call.hasUserClass).toBe(true)
  })

  it("handles static-only components and separates secondary cn calls by element", () => {
    const code = `
      function Switch({ className, ...props }) {
        return (
          <SwitchPrimitive.Root data-slot="switch" className={cn("peer inline-flex", className)} {...props}>
            <SwitchPrimitive.Thumb data-slot="switch-thumb" className={cn("pointer-events-none block rounded-full")} />
          </SwitchPrimitive.Root>
        )
      }
      export { Switch }
    `
    const ast = parseTsx(code)
    const definitions = extractCvaDefinitions(ast, "switch", "ui/switch.tsx")
    const exports = discoverExports(ast, "switch", "ui/switch.tsx")
    const analysis = analyzeCn(ast, exports[0]!.functionNode!, definitions, "switch", "ui/switch.tsx")
    expect(analysis.calls.length).toBe(2)

    const root = analysis.calls.find((call) => call.slot === "switch")!
    expect(root.cvaRef).toBeNull()
    expect(root.statics).toEqual(["peer inline-flex"])
    expect(root.hasUserClass).toBe(true)

    const thumb = analysis.calls.find((call) => call.slot === "switch-thumb")!
    expect(thumb.statics).toEqual(["pointer-events-none block rounded-full"])
    expect(thumb.hasUserClass).toBe(false)
  })
})

describe("derive: combinations", () => {
  it("pre-resolves every combination with the real cva + tailwind-merge", () => {
    const ast = parseTsx(FIXTURE_BUTTON_TSX)
    const def = extractCvaDefinitions(ast, "button", "ui/button.tsx").get("buttonVariants")!
    const combinations = resolveCnCombinations(def, [])
    expect(Object.keys(combinations).sort()).toEqual([
      "size=default&variant=default",
      "size=default&variant=outline",
      "size=sm&variant=default",
      "size=sm&variant=outline",
    ])
    // sm は text-xs を持つため、base の text-sm は tailwind-merge により除去される(後勝ち)
    expect(combinations["size=sm&variant=default"]).toContain("text-xs")
    expect(combinations["size=sm&variant=default"]).not.toContain("text-sm")
    // rounded-md の競合も解決される
    expect(combinations["size=default&variant=default"]).toContain("rounded-md")
  })

  it("resolves static-only components to a single empty-key entry", () => {
    expect(resolveCnCombinations(null, ["p-4", "p-2"])).toEqual({ "": "p-2" })
  })

  it("guards against combination explosion", () => {
    const variants: Record<string, Record<string, string>> = {}
    for (let i = 0; i < 11; i += 1) variants[`v${i}`] = { a: "x", b: "y" }
    expect(() => resolveCnCombinations({ identifier: "x", base: "", variants, compound: [], defaults: {} }, [])).toThrow(/explosion/)
  })
})

describe("emit: determinism", () => {
  const contract = (): Contract => ({
    schema_version: 1,
    name: "button",
    source: { item_sha256: "abc123" },
    exports: {
      Button: {
        root_slot: "button",
        classes_slot: "button",
        component_class: "Shadcn::Button",
        cva: { prop_names: ["size", "variant"], defaults: { size: "default", variant: "default" }, compound: [] },
        combinations: {
          "size=default&variant=default": "inline-flex bg-primary",
          "size=sm&variant=default": "inline-flex bg-primary h-8",
        },
        slots: [{ name: "button", tag: "button", static_attributes: {}, dynamic_attributes: ["data-variant"] }],
        passthrough_class: true,
      },
    },
    css_vars: { light: {}, dark: {} },
    css: "",
    registry_dependencies: [],
  })

  it("renders stable Ruby across invocations", () => {
    expect(renderContractRuby(contract())).toBe(renderContractRuby(contract()))
    expect(renderContractRuby(contract())).toContain("# !! AUTO-GENERATED by tools/extractor — DO NOT EDIT !!")
    expect(renderContractRuby(contract())).toContain("{ size: :default, variant: :default } => \"inline-flex bg-primary\"")
  })

  it("renders stable theme CSS with radius first and sorted tokens", () => {
    const theme = { light: { background: "oklch(1 0 0)", radius: "0.625rem", primary: "oklch(0 0 0)" }, dark: { background: "oklch(0 0 0)" } }
    const css = renderThemeCss(theme, [])
    expect(css).toBe(renderThemeCss(theme, []))
    const rootBlock = css.split("\n.dark {")[0]!
    expect(rootBlock.indexOf("--radius")).toBeLessThan(rootBlock.indexOf("--background"))
    expect(rootBlock.indexOf("--background")).toBeLessThan(rootBlock.indexOf("--primary"))
    expect(css).toContain("--color-primary: var(--primary);")
    expect(css).toContain("--radius-lg: var(--radius);")
  })
})
