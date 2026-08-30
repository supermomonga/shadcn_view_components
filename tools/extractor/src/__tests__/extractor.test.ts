import { describe, expect, it } from "vitest"

import { parseTsx } from "../parse/ast.ts"
import { extractCvaDefinitions } from "../parse/cva.ts"
import { analyzeCn } from "../parse/cn.ts"
import { discoverExports } from "../parse/context.ts"
import { collectSlots } from "../parse/slots.ts"
import { resolveCnCombinations, resolveConstrainedCombinations } from "../derive/combinations.ts"
import { renderContractRuby } from "../emit/ruby.ts"
import { renderThemeCss } from "../emit/css.ts"
import { snakeCase } from "../normalize.ts"
import { extractContractFromItem } from "../pipeline.ts"
import type { Contract } from "../contract.ts"
import type { Manifest } from "../manifest.ts"

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
  it("keeps exported primitive Root aliases as canonical empty contracts", async () => {
    const source = `
      const Select = SelectPrimitive.Root
      const Combobox = ComboboxPrimitive.Root
      const ConfigurationRoot = Configuration.Root
      const variants = cva("base", {})
      export { Select, Combobox, ConfigurationRoot, variants }
    `
    const ast = parseTsx(source)
    const discovered = discoverExports(ast, "picker", "ui/picker.tsx")
    expect(discovered.map(({ name, primitiveRootTag }) => [name, primitiveRootTag])).toEqual([
      ["Select", "SelectPrimitive.Root"],
      ["Combobox", "ComboboxPrimitive.Root"],
      ["ConfigurationRoot", null],
      ["variants", null],
    ])

    const contract = await extractContractFromItem(
      "",
      { items: {} } as Manifest,
      "picker",
      { name: "picker", files: [{ path: "ui/picker.tsx", content: source }] },
      "abc123",
      {},
    )
    expect(contract.exports.Select).toEqual({
      root_slot: "",
      classes_slot: "",
      component_class: "Shadcn::Select",
      cva: { prop_names: [], defaults: {}, compound: [] },
      combinations: { "": "" },
      slots: [{
        name: "",
        tag: "SelectPrimitive.Root",
        static_attributes: {},
        dynamic_attributes: [],
      }],
      passthrough_class: false,
    })
    expect(contract.exports.Combobox?.slots[0]?.tag).toBe("ComboboxPrimitive.Root")
    expect(contract.exports.ConfigurationRoot).toBeUndefined()
    expect(contract.exports.variants).toBeUndefined()
  })

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

  it("tolerates base-nova constructs: IconPlaceholder elements and a render prop with JSX element value", () => {
    const code = `
      import { IconPlaceholder } from "@/app/(create)/components/icon-placeholder"
      function DialogContent() {
        return (
          <div data-slot="dialog-content">
            <button data-slot="dialog-close" render={<Button variant="ghost" />}>
              <IconPlaceholder lucide="XIcon" tabler="IconX" />
              <span className="sr-only">Close</span>
            </button>
          </div>
        )
      }
      export { DialogContent }
    `
    const ast = parseTsx(code)
    const exports = discoverExports(ast, "dialog", "ui/dialog.tsx")
    const slots = collectSlots(ast, exports[0]!.functionNode!, "dialog", "ui/dialog.tsx")
    // render prop(JSX要素を値に持つ動的属性)は ParseError にならず動的属性として記録される
    const close = slots.slots.find((slot) => slot.name === "dialog-close")!
    expect(close.dynamic_attributes).toContain("render")
    // data-slot を持たない要素(IconPlaceholder・render先のButton)はスロットにならない
    expect(slots.slots.map((slot) => slot.name).sort()).toEqual(["dialog-close", "dialog-content"])
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
    expect(call.cvaOptions.map((option) => option.prop).sort()).toEqual(["size", "variant"])
    expect(call.cvaOptions.every((option) => option.kind === "passthrough")).toBe(true)
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

  it("records conditional cva options (isActive ? \"outline\" : \"ghost\") as an exposed prop", () => {
    const code = `
      const buttonVariants = cva("inline-flex rounded-md", {
        variants: {
          variant: { ghost: "hover:bg-accent", outline: "border" },
          size: { icon: "size-9", default: "h-9 px-4" },
        },
        defaultVariants: { variant: "default", size: "default" },
      })
      function PaginationLink({ className, isActive, size = "icon", ...props }) {
        return (
          <a
            data-slot="pagination-link"
            data-active={isActive}
            className={cn(buttonVariants({ variant: isActive ? "outline" : "ghost", size }), className)}
            {...props}
          />
        )
      }
      export { PaginationLink }
    `
    const ast = parseTsx(code)
    const definitions = extractCvaDefinitions(ast, "pagination", "ui/pagination.tsx")
    const exports = discoverExports(ast, "pagination", "ui/pagination.tsx")
    const analysis = analyzeCn(ast, exports[0]!.functionNode!, definitions, "pagination", "ui/pagination.tsx")
    const call = analysis.calls[0]!
    expect(call.cvaRef).toBe("buttonVariants")
    expect(call.cvaOptions).toEqual([
      { prop: "variant", kind: "conditional", condition: "isActive", trueValue: "outline", falseValue: "ghost" },
      { prop: "size", kind: "passthrough" },
    ])
  })

  it("exposes enum guards (side === \"right\" && \"...\") as contract props with all branches", () => {
    const code = `
      function SheetContent({ className, children, side = "right", showCloseButton = true, ...props }) {
        return (
          <div
            data-slot="sheet-content"
            className={cn(
              "fixed z-50 flex flex-col",
              side === "right" && "inset-y-0 right-0 w-3/4",
              side === "left" && "inset-y-0 left-0 w-3/4",
              side === "top" && "inset-x-0 top-0 h-auto",
              className
            )}
            {...props}
          />
        )
      }
      export { SheetContent }
    `
    const ast = parseTsx(code)
    const definitions = extractCvaDefinitions(ast, "sheet", "ui/sheet.tsx")
    const exports = discoverExports(ast, "sheet", "ui/sheet.tsx")
    const analysis = analyzeCn(ast, exports[0]!.functionNode!, definitions, "sheet", "ui/sheet.tsx")
    const call = analysis.calls[0]!
    expect(call.guards.map((guard) => [guard.identifier, guard.value])).toEqual([
      ["side", "right"],
      ["side", "left"],
      ["side", "top"],
    ])

    const combinations = resolveConstrainedCombinations(null, ["fixed z-50 flex flex-col"], [], call.guards)
    expect(Object.keys(combinations).sort()).toEqual(["side=left", "side=right", "side=top"])
    expect(combinations["side=right"]).toContain("right-0")
    expect(combinations["side=left"]).toContain("left-0")
    expect(combinations["side=top"]).toContain("top-0")
    expect(combinations["side=top"]).not.toContain("right-0")
  })

  it("derives conditional prop defaults from boolean parameter defaults (isActive = true)", () => {
    const code = `
      const linkVariants = cva("base", {
        variants: { variant: { on: "bg-active", off: "bg-inactive" } },
      })
      function Link({ className, isActive = true, ...props }) {
        return (
          <a
            data-slot="link"
            className={cn(linkVariants({ variant: isActive ? "on" : "off" }), className)}
            {...props}
          />
        )
      }
      export { Link }
    `
    const ast = parseTsx(code)
    const definitions = extractCvaDefinitions(ast, "link", "ui/link.tsx")
    const exports = discoverExports(ast, "link", "ui/link.tsx")
    const analysis = analyzeCn(ast, exports[0]!.functionNode!, definitions, "link", "ui/link.tsx")
    const def = definitions.get("linkVariants")!
    const combos = resolveConstrainedCombinations(def, [], analysis.calls[0]!.cvaOptions)
    expect(Object.keys(combos).sort()).toEqual(["is_active=false", "is_active=true"])
    expect(combos["is_active=true"]).toContain("bg-active")
    expect(combos["is_active=false"]).toContain("bg-inactive")
  })

  it("evaluates bare identifier guards (showOnHover && \"...\") against boolean defaults", () => {
    const code = `
      function MenuAction({ className, showOnHover = false, ...props }) {
        return (
          <div
            data-slot="menu-action"
            className={cn("absolute top-1 right-1", showOnHover && "md:opacity-0", className)}
            {...props}
          />
        )
      }
      export { MenuAction }
    `
    const ast = parseTsx(code)
    const definitions = extractCvaDefinitions(ast, "menu", "ui/menu.tsx")
    const exports = discoverExports(ast, "menu", "ui/menu.tsx")
    const analysis = analyzeCn(ast, exports[0]!.functionNode!, definitions, "menu", "ui/menu.tsx")
    // 既定 false のため偽陽性クラスは採られない
    expect(analysis.calls[0]!.statics).toEqual(["absolute top-1 right-1"])
  })

  it("resolves orientation-style conditional statics using the file-scoped param default", () => {
    const code = `
      function Carousel({ orientation = "horizontal", className, ...props }) {
        return <div data-slot="carousel" className={cn("relative", className)} {...props} />
      }
      function CarouselItem({ className, ...props }) {
        return (
          <div
            data-slot="carousel-item"
            className={cn("min-w-0 shrink-0 grow-0 basis-full", orientation === "horizontal" ? "pl-4" : "pt-4", className)}
            {...props}
          />
        )
      }
      export { Carousel, CarouselItem }
    `
    const ast = parseTsx(code)
    const definitions = extractCvaDefinitions(ast, "carousel", "ui/carousel.tsx")
    const item = discoverExports(ast, "carousel", "ui/carousel.tsx").find((entry) => entry.name === "CarouselItem")!
    const analysis = analyzeCn(ast, item.functionNode!, definitions, "carousel", "ui/carousel.tsx")
    expect(analysis.calls[0]!.statics).toEqual(["min-w-0 shrink-0 grow-0 basis-full", "pl-4"])
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

  it("appends statics AFTER the cva output so conflicts resolve like upstream cn(...)", () => {
    // upstream: cn(cvaOut, "w-auto px-3") — 静的クラスが後勝ちする(引数順序の再現)。
    // 退行すると静的クラスが base 側に繰り込まれ、バリアントの px-2 が勝ってしまう
    const def = {
      identifier: "toggleVariants",
      base: "inline-flex",
      variants: { size: { default: "h-9 px-2", sm: "h-8 px-1.5" } },
      compound: [],
      defaults: { size: "default" },
    }
    const combinations = resolveCnCombinations(def, ["w-auto min-w-0 shrink-0 px-3"])
    expect(combinations["size=default"]).toContain("px-3")
    expect(combinations["size=default"]).not.toContain("px-2")
    expect(combinations["size=sm"]).not.toContain("px-1.5")

    const constrained = resolveConstrainedCombinations(def, ["w-auto px-3"], [
      { prop: "size", kind: "passthrough" },
    ])
    expect(Object.keys(constrained).sort()).toEqual(["size=default", "size=sm"])
    expect(constrained["size=default"]).toContain("px-3")
    expect(constrained["size=sm"]).not.toContain("px-1.5")
  })

  it("resolves static-only components to a single empty-key entry", () => {
    expect(resolveCnCombinations(null, ["p-4", "p-2"])).toEqual({ "": "p-2" })
  })

  it("enumerates constrained combinations with snake_cased conditional props", () => {
    const definition = {
      identifier: "buttonVariants",
      base: "inline-flex rounded-md",
      variants: {
        variant: { ghost: "hover:bg-accent", outline: "border" },
        size: { icon: "size-9", default: "h-9 px-4" },
      },
      compound: [],
      defaults: { variant: "default", size: "default" },
    }
    const combinations = resolveConstrainedCombinations(definition, [], [
      { prop: "variant", kind: "conditional", condition: "isActive", trueValue: "outline", falseValue: "ghost" },
      { prop: "size", kind: "passthrough" },
    ])
    expect(Object.keys(combinations).sort()).toEqual([
      "is_active=false&size=default",
      "is_active=false&size=icon",
      "is_active=true&size=default",
      "is_active=true&size=icon",
    ])
    expect(combinations["is_active=true&size=icon"]).toContain("border")
    expect(combinations["is_active=true&size=icon"]).toContain("size-9")
    expect(combinations["is_active=false&size=icon"]).toContain("hover:bg-accent")

    // 固定値は全組み合わせに適用され、契約側propには現れない
    const fixed = resolveConstrainedCombinations(definition, [], [{ prop: "variant", kind: "fixed", value: "outline" }])
    expect(Object.keys(fixed)).toEqual([""])
    expect(fixed[""]).toContain("border")
  })

  it("snake_cases camelCase identifiers for Ruby kwargs", () => {
    expect(snakeCase("isActive")).toBe("is_active")
    expect(snakeCase("size")).toBe("size")
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
    expect(renderContractRuby(contract(), "base-nova")).toBe(renderContractRuby(contract(), "base-nova"))
    expect(renderContractRuby(contract(), "base-nova")).toContain("# !! AUTO-GENERATED by tools/extractor — DO NOT EDIT !!")
    expect(renderContractRuby(contract(), "base-nova")).toContain("# Source: shadcn/ui base-nova \"button\" (item sha256: abc123)")
    expect(renderContractRuby(contract(), "base-nova")).toContain("{ size: :default, variant: :default } => \"inline-flex bg-primary\"")
  })

  it("renders stable theme CSS with radius first and sorted tokens", () => {
    const theme = { light: { background: "oklch(1 0 0)", radius: "0.625rem", primary: "oklch(0 0 0)" }, dark: { background: "oklch(0 0 0)" } }
    const css = renderThemeCss(theme, [], "base-nova", "@custom-variant data-open {\n}")
    expect(css).toBe(renderThemeCss(theme, [], "base-nova", "@custom-variant data-open {\n}"))
    expect(css).toContain("/* Source: shadcn/ui base-nova (manifest: vendor/shadcn/manifest.json) */")
    const rootBlock = css.split("\n.dark {")[0]!
    expect(rootBlock.indexOf("--radius")).toBeLessThan(rootBlock.indexOf("--background"))
    expect(rootBlock.indexOf("--background")).toBeLessThan(rootBlock.indexOf("--primary"))
    expect(css).toContain("--color-primary: var(--primary);")
    expect(css).toContain("--radius-lg: var(--radius);")
  })
})
