---
number: 15
title: Model Form on Field primitives as a local override
status: accepted
date: 2026-09-03
---

# Model Form on Field primitives as a local override

## Context and Problem Statement

`base-nova` no longer publishes the legacy form registry item. Its forms guidance composes Field primitives and wires invalid state explicitly. Retaining the old `new-york-v4` contract would preserve an upstream model that is no longer current.

## Decision Drivers

* Align Rails form composition with current Field-based upstream guidance.
* Keep validation ownership in Rails form objects and helpers.
* Avoid maintaining obsolete `Form::Control` and `Form::Message` abstractions.
* Represent the remaining Rails integration through the normal contract pipeline.

## Considered Options

* Preserve the legacy `new-york-v4` form contract for compatibility.
* Remove all form-specific helpers.
* Maintain a minimal Field-based local override for Rails form integration.

## Decision Outcome

Chosen option: "Maintain a minimal Field-based local override for Rails form integration". `Form::Item` supplies Field structure and maps `invalid:` to `data-invalid`. `Form::Error` follows FieldError behavior: one message renders as text, multiple messages render as a list, and no errors render nothing. Applications use `Shadcn::Field` label and description components directly.

The removed `Form::Control` and `Form::Message` APIs are not retained through compatibility aliases.

### Consequences

* Good, because current form markup follows the upstream Field model.
* Good, because the Rails-specific API remains small and server-authoritative.
* Good, because the override is extracted and checked like other registry contracts.
* Bad, because upgrading from the legacy API requires consumer changes.
* Bad, because the project owns the local override until upstream publishes an extractable equivalent.

### Confirmation

The manifest marks `form` as a local override. Contract, component, documentation, and visual scenarios verify the two exported classes and invalid-state behavior.

## More Information

The current public API appears in the [Form component reference](../reference/components/form.md).
