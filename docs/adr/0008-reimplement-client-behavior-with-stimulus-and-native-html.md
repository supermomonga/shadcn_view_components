---
number: 8
title: Reimplement client behavior with Stimulus and native HTML
status: accepted
date: 2026-09-03
---

# Reimplement client behavior with Stimulus and native HTML

## Context and Problem Statement

Interactive upstream components rely on React and Base UI or Radix behavior that cannot run inside server-rendered ViewComponents. The gem must provide useful interaction without importing those runtimes or making server rendering secondary.

## Decision Drivers

* Preserve a Rails and Hotwire-native runtime.
* Keep server-rendered HTML as the source of structure and content.
* Use browser platform behavior where it satisfies accessibility requirements.
* Survive Turbo caching, reconnection, and frame navigation.

## Considered Options

* Bundle React and the upstream primitive libraries.
* Provide styles only and leave every interaction to applications.
* Implement behavior with Stimulus and native HTML elements, adding controller logic where needed.

## Decision Outcome

Chosen option: "Implement behavior with Stimulus and native HTML elements, adding controller logic where needed". Components prefer `<dialog>`, the Popover API, `<details>`, links, and native form controls. Stimulus controllers enhance server-rendered DOM, do not reconstruct it, and clean up global state and listeners on disconnect. Components document whether no-JavaScript behavior is complete, readable, or JavaScript-required.

Exact React-internal behavior is not a compatibility target. Keyboard, focus, ARIA, form submission, and Turbo behavior are explicit contracts for the Rails implementation.

### Consequences

* Good, because consumers do not load React, Base UI, or Radix.
* Good, because initial content remains server-rendered and testable.
* Good, because native browser semantics reduce custom state where appropriate.
* Bad, because behavior can intentionally differ from upstream React primitives.
* Bad, because accessible composite widgets still require substantial Stimulus and system-test coverage.

### Confirmation

System specs verify keyboard, focus, ARIA, form, and Turbo behavior. The component reference states client requirements and state ownership for each public component.

## More Information

Current controller and fallback rules are documented in [Stimulus and Hotwire](../reference/stimulus-hotwire.md).
