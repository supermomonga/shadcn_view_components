---
number: 14
title: Follow the base-nova registry style
status: accepted
date: 2026-09-03
---

# Follow the base-nova registry style

## Context and Problem Statement

shadcn/ui publishes multiple styles with different primitives, dependencies, files, and component availability. A generator and compatibility contract cannot treat them as interchangeable.

## Decision Drivers

* Follow the current upstream default rather than a legacy fallback.
* Keep one unambiguous extraction and conformance target.
* Avoid multiplying generated artifacts and behavior implementations by style.
* Make deviations from that target explicit.

## Considered Options

* Continue following `new-york-v4`.
* Support every published registry style.
* Follow `base-nova` and represent necessary deviations as reviewed local overrides.

## Decision Outcome

Chosen option: "Follow `base-nova` and represent necessary deviations as reviewed local overrides". Synchronization selects the `base-nova` registry shape and its shared style dependencies. The gem does not promise multiple style variants. A missing or unsuitable upstream item may use a manifest-declared local override only when its Rails contract is documented and tested.

### Consequences

* Good, because the project follows the upstream documentation and CLI default.
* Good, because one style defines the generated visual and structural contract.
* Good, because local differences are visible in the manifest.
* Bad, because consumers cannot select other shadcn/ui styles from this gem.
* Bad, because another upstream default migration requires an explicit new decision and coordinated regeneration.

### Confirmation

Sync tests assert the selected registry style and manifest origins. Generated contracts and visual parity use the same style identifier.

## More Information

The current source selection is documented in [Upstream synchronization](../reference/upstream-sync.md).
