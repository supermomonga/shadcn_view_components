---
number: 12
title: Verify compatibility through layered automated testing
status: accepted
date: 2026-09-03
---

# Verify compatibility through layered automated testing

## Context and Problem Statement

No single test type can prove that a generated contract, a server-rendered component, browser behavior, packaging, and visual output remain aligned with upstream. A durable verification strategy must assign each compatibility risk to an independent check.

## Decision Drivers

* Detect class and slot drift without duplicating expected values by hand.
* Test Ruby APIs separately from browser behavior.
* Exercise real browser accessibility and form interactions.
* Detect packaging, generation, documentation, and visual regressions.

## Considered Options

* Rely on component unit tests alone.
* Rely on visual screenshots alone.
* Maintain layered component, conformance, system, integrity, and visual parity checks.

## Decision Outcome

Chosen option: "Maintain layered component, conformance, system, integrity, and visual parity checks". Component specs own Ruby API behavior. Conformance examples are generated from contract and registry data. Cuprite system specs own Stimulus and browser behavior. Integrity checks own generated artifacts, packaging, documentation, and determinism. Visual parity compares declared preview scenarios in light and dark themes and records explicit exclusions when the same state cannot be represented.

Coverage registries distinguish implemented, intentionally unsupported, and explicitly excluded scenarios. They do not provide a generic pending state.

### Consequences

* Good, because each failure points to a specific ownership boundary.
* Good, because contract expectations are derived instead of copied into examples.
* Good, because unsupported or incomparable behavior remains visible and reviewable.
* Bad, because full verification requires Ruby, Node.js, Chrome, and Tailwind tooling.
* Bad, because registries and preview scenarios must evolve with public behavior.

### Confirmation

CI executes each layer and reports it separately. Documentation generation and registry-contract specs ensure that declared coverage matches shipped classes and examples.

## More Information

Test ownership and commands are documented in [Testing strategy](../reference/testing.md).
