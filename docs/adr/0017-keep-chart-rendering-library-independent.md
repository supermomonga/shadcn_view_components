---
number: 17
title: Keep Chart rendering library-independent
status: accepted
date: 2026-09-03
---

# Keep Chart rendering library-independent

## Context and Problem Statement

The upstream Chart component wraps Recharts, which has no equivalent runtime inside a server-rendered Rails ViewComponent gem. Selecting a client chart library for all consumers would broaden the gem's dependency and state ownership beyond its component contract.

## Decision Drivers

* Avoid imposing a charting runtime on Rails applications.
* Preserve reusable shadcn chart styling and content helpers.
* Be explicit about which upstream state cannot be compared.
* Let applications choose server-side SVG, Chartkick, or another renderer.

## Considered Options

* Bundle a specific browser charting library.
* Generate complete charts as server-side SVG.
* Provide renderer-independent container, style, tooltip content, and legend content helpers.
* Mark Chart entirely unsupported.

## Decision Outcome

Chosen option: "Provide renderer-independent container, style, tooltip content, and legend content helpers". The gem owns shadcn-compatible styling and presentation around chart data but not series layout, axes, animation, or a chart engine. Applications integrate their selected renderer inside this boundary.

Because the Rails and upstream implementations cannot be placed in the same runtime state, Chart is excluded from visual parity with the reason recorded in the coverage registry. Its server rendering and public API remain tested.

### Consequences

* Good, because consumers retain control of their charting library and data lifecycle.
* Good, because reusable shadcn chart presentation remains available.
* Good, because the unsupported comparison boundary is declared rather than hidden.
* Bad, because the gem does not offer a complete drop-in equivalent to the upstream Recharts component.
* Bad, because chart-library integration is application responsibility.

### Confirmation

Component and contract specs verify the renderer-independent helpers. The coverage registry and documentation checks require the visual-parity exclusion and its reason.

## More Information

The supported classes and limits appear in the [Chart component reference](../reference/components/chart.md).
