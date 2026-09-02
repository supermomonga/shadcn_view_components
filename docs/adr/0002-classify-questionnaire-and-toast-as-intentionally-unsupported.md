---
number: 2
title: Classify questionnaire and toast as intentionally unsupported
status: accepted
date: 2026-09-02
---

# Classify questionnaire and toast as intentionally unsupported

## Context and Problem Statement

The vendored base-nova registry contains `questionnaire` and `toast`, but this gem exposes neither as a public ViewComponent. A visual-only port would not provide the state, form, accessibility, or notification behavior owned by their React and Base UI dependencies. We need a durable classification that distinguishes deliberate non-support from an implementation omission and requires re-evaluation when either vendored item changes.

## Decision Drivers

* Avoid inventing a shared Rails state model without recurring concrete requirements.
* Keep a single notification API instead of maintaining overlapping Toast and Sonner providers, managers, and rendering regions.
* Preserve the gem's React and Base UI-free runtime.
* Make unsupported decisions machine-readable and automatically detect relevant upstream item changes.
* Provide practical Rails alternatives without broadening the public runtime API.

## Considered Options

* Implement Rails versions of both `questionnaire` and `toast`.
* Implement `questionnaire` and extend Sonner until it covers Toast.
* Keep both items pending until demand or upstream behavior changes.
* Classify both items as intentionally unsupported and document supported alternatives.

## Decision Outcome

Chosen option: "Classify both items as intentionally unsupported and document supported alternatives", because it establishes a complete support boundary without speculatively designing runtime behavior.

`questionnaire` will not be implemented until recurring shared Rails requirements justify a common state model. Applications should compose the existing `form`, `field`, `input`, `radio-group`, `checkbox`, `button`, and `progress` items and keep multi-step state in their controller, form object, session, or model. Validation failures render the active step again with HTTP 422 and restored values and errors.

`toast` will not be exposed as a separate component. Although base-nova uses Toast as its standard notification component, this gem deliberately retains the existing `Shadcn::Sonner::Toaster`, `shadcn--toast` Stimulus controller, and `shadcn:toast` event with `title`, `description`, and `duration`. Actionable or persistent important information uses `Shadcn::Alert`. This avoids adding a React or Base UI runtime and avoids maintaining a second notification API.

The conformance registry must classify every vendored item with exactly one of `exports` or `unsupported`. An `unsupported` entry contains only `reason`, `alternatives`, and `reviewed_sha256`; alternatives must reference implemented items, and the reviewed hash must match the vendored manifest. There is no `pending`, `deferred`, or legacy compatibility state.

### Consequences

* Good, because unsupported items are distinguishable from missed implementations in CI and generated documentation.
* Good, because an item hash change forces re-evaluation instead of silently preserving an outdated decision.
* Good, because the runtime keeps one notification path and adds no React or Base UI dependency.
* Good, because applications receive concrete server-driven form and current Sonner migration guidance.
* Bad, because consumers needing Questionnaire's browser-side state machine must implement an application-specific flow.
* Bad, because the current Sonner path does not provide Action, Close, type or priority, pause, swipe, or promise and loading behavior.
* Bad, because `reviewed_sha256` detects registry item changes but cannot by itself detect behavior changes inside an unchanged external package reference.

### Confirmation

CI confirms the decision by requiring manifest and registry keys to match, validating the exclusive `exports` or `unsupported` schema, checking alternative references and item hashes, generating the README inventory from the registry, and running documentation consistency checks. Runtime Sonner files and public APIs remain unchanged.

## Pros and Cons of the Options

### Implement both items

* Good, because the public inventory would cover all vendored items.
* Bad, because Questionnaire requires a substantial Rails-specific state machine without shared requirements.
* Bad, because Toast duplicates the existing Sonner notification ownership.
* Bad, because both ports create behavior and accessibility obligations that cannot be satisfied by class extraction alone.

### Implement Questionnaire and extend Sonner

* Good, because the existing notification API could gain more upstream Toast capabilities.
* Bad, because the Sonner expansion introduces independent API, focus, timing, server-side rendering, and Turbo reconnection decisions outside this issue's required policy decision.
* Bad, because Questionnaire still introduces speculative shared state ownership.

### Keep the items pending

* Good, because it defers implementation cost.
* Bad, because pending cannot distinguish deliberate non-support from unfinished work.
* Bad, because users do not receive a stable support boundary or migration guidance.

### Intentionally unsupported with alternatives

* Good, because it establishes a complete, testable support boundary now.
* Good, because the alternatives use existing Rails-native components and notification APIs.
* Neutral, because future implementation remains possible after explicit re-evaluation.
* Bad, because upstream feature parity is intentionally incomplete.

## More Information

Re-evaluate `questionnaire` when recurring requirements cannot be satisfied by a server-authoritative multi-step form. Re-evaluate `toast` when concrete notification requirements cannot be met by current Sonner or Alert. Re-evaluate either decision when its `reviewed_sha256` changes.

The public migration guide is [`docs/unsupported-components.md`](../unsupported-components.md). This decision resolves GitHub Issue #4.
