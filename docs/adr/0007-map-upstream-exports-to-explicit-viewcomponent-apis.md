---
number: 7
title: Map upstream exports to explicit ViewComponent APIs
status: accepted
date: 2026-09-03
---

# Map upstream exports to explicit ViewComponent APIs

## Context and Problem Statement

React exports and props cannot be copied directly into server-rendered Ruby components. The gem needs a predictable public mapping that preserves upstream concepts without inventing an unrelated Rails API.

## Decision Drivers

* Make names and options discoverable from upstream documentation and contracts.
* Preserve normal Ruby keyword and ViewComponent usage.
* Avoid unsupported client callback and `asChild` semantics.
* Define attribute, class, slot, and failure behavior consistently.

## Considered Options

* Design an independent Rails API for every component.
* Emulate React props and slot behavior exactly.
* Apply one explicit mapping from upstream exports and props to ViewComponent classes and keywords.

## Decision Outcome

Chosen option: "Apply one explicit mapping from upstream exports and props to ViewComponent classes and keywords". Public classes use the `Shadcn::` namespace, upstream export names, snake-case keyword arguments, contract-derived defaults, and explicit subcomponent composition. Components accept ordinary HTML attributes through `**args`; classes are merged through the shared resolver. Unknown variant values fail rather than falling back.

`asChild` and React event callbacks are not public compatibility promises. Polymorphic rendering is exposed only where an explicit `tag:` or class helper has a concrete Rails use case. Rails-only properties require a documented contract and tests.

### Consequences

* Good, because users can predict Ruby APIs from upstream component concepts.
* Good, because public behavior is uniform and machine-documentable.
* Good, because invalid variants surface immediately.
* Bad, because some React composition patterns require a different Rails call shape.
* Bad, because intentional deviations must be maintained in semantic metadata and tests.

### Confirmation

The conformance registry, property contracts, generated component reference, and component specs verify exported classes, signatures, attributes, slots, and variants.

## More Information

The exact current mapping is maintained in [Component conventions](../reference/component-conventions.md) and the [generated component API reference](../reference/components/README.md).
