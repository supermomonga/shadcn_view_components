---
number: 9
title: Support Tailwind CSS v4 through Rails engine builds
status: accepted
date: 2026-09-03
---

# Support Tailwind CSS v4 through Rails engine builds

## Context and Problem Statement

The gem needs upstream-compatible theme tokens and utilities in a host application's final stylesheet. Supporting multiple Tailwind generations or bypassing the host build would create duplicate configuration and unreliable source scanning.

## Decision Drivers

* Follow the current upstream CSS-first configuration.
* Keep one supported Rails integration path.
* Ensure gem Ruby, ERB, JavaScript, and generated contracts are scanned by Tailwind.
* Avoid persisting machine-specific gem paths in host applications.

## Considered Options

* Support both Tailwind CSS v3 and v4.
* Ship a precompiled standalone stylesheet.
* Require Tailwind CSS v4 and integrate through `tailwindcss-rails` engine builds.

## Decision Outcome

Chosen option: "Require Tailwind CSS v4 and integrate through `tailwindcss-rails` engine builds". Generated theme CSS is imported by the engine's Tailwind input. `tailwindcss-rails` 4.3 or newer creates the host build wrapper and scans gem sources. The installer adds fixed imports to the standard host Tailwind input and does not write physical gem paths or configurable alternate inputs.

The gem provides default tokens and the `.dark` contract but does not own an application theme switcher.

### Consequences

* Good, because the integration follows Tailwind v4 and Rails engine conventions.
* Good, because gem upgrades do not require rewriting host-specific source paths.
* Good, because consumers can override CSS variables in their own stylesheet.
* Bad, because Tailwind v3 applications are unsupported.
* Bad, because hosts must use the supported Tailwind input and install `tw-animate-css`.

### Confirmation

Engine distribution specs, installer tests, and a real Tailwind build verify imports, source discovery, generated wrapper ownership, and class output.

## More Information

Installation and theme behavior are documented in [Theming and Tailwind CSS](../reference/theming-tailwind.md).
