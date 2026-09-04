---
number: 16
title: Retain DirectionProvider as a local override
status: accepted
date: 2026-09-03
---

# Retain DirectionProvider as a local override

## Context and Problem Statement

The `base-nova` direction item is a pure re-export from `@base-ui/react` and provides no extractable class or slot contract. The gem already has a small server-rendered direction provider that emits the HTML `dir` boundary needed by its components.

## Decision Drivers

* Preserve functional left-to-right and right-to-left markup without adding Base UI.
* Avoid inventing generated contract data where upstream exposes none.
* Keep the local difference visible during synchronization.
* Re-evaluate if upstream later publishes an extractable contract.

## Considered Options

* Remove direction support.
* Add Base UI solely for the direction provider.
* Retain the existing `Shadcn::DirectionProvider` and its local registry override.

## Decision Outcome

Chosen option: "Retain the existing `Shadcn::DirectionProvider` and its local registry override". The component owns only the `dir` attribute boundary. The vendored override mirrors enough registry shape to keep inventory and review behavior consistent. The weekly synchronization shadow warning is an accepted operational signal, not something to suppress.

### Consequences

* Good, because applications keep direction markup without a client runtime dependency.
* Good, because the implementation remains small and explicit.
* Good, because an upstream change remains visible through synchronization checks.
* Bad, because the item is not structurally generated from the current upstream implementation.
* Bad, because maintainers must review the override when upstream direction behavior changes.

### Confirmation

Manifest and contract checks classify the origin, and component tests verify valid direction values and rendered `dir` output.

## More Information

The current public behavior appears in the [Direction component reference](../reference/components/direction.md).
