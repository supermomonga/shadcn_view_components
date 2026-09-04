---
number: 5
title: Separate generated contracts from handwritten runtime behavior
status: accepted
date: 2026-09-03
---

# Separate generated contracts from handwritten runtime behavior

## Context and Problem Statement

Some shadcn/ui properties can be derived mechanically from registry TSX, while Rails rendering and interaction semantics require deliberate implementation. Mixing both in handwritten components would make upstream drift difficult to identify and encourage duplicated class definitions.

## Decision Drivers

* Expose upstream structural and visual changes as reviewable generated diffs.
* Keep semantic Rails behavior understandable and testable.
* Prevent generated files from becoming an undocumented second source of truth.
* Fail visibly when a component diverges from its extracted contract.

## Considered Options

* Handwrite all component classes, templates, and styles.
* Translate complete TSX implementations to Ruby and JavaScript.
* Generate structural contracts and keep Rails structure and behavior handwritten.

## Decision Outcome

Chosen option: "Generate structural contracts and keep Rails structure and behavior handwritten". Vendored items are transformed into committed JSON contracts, Ruby contract modules, and theme CSS. ViewComponent templates and Stimulus controllers are handwritten consumers of those contracts. Generated outputs are never edited directly, and handwritten component code does not duplicate upstream class strings.

### Consequences

* Good, because upstream class, variant, slot, and theme changes appear in generated diffs.
* Good, because Rails-specific HTML and behavior remain explicit source code.
* Good, because conformance tests can compare rendering with an independent contract.
* Bad, because structural upstream changes can require coordinated extractor and handwritten implementation changes.
* Bad, because the repository commits both source snapshots and derived outputs.

### Confirmation

Determinism checks regenerate all derived artifacts and require a clean diff. Conformance tests compare rendered classes, slots, and attributes with the committed contracts.

## More Information

See [Architecture](../reference/architecture.md) and [Extraction and code generation](../reference/extraction-codegen.md).
