---
number: 19
title: Require exact RGBA visual parity with scoped exceptions
status: accepted
date: 2026-09-25
links:
- target: 12
  kind: amends
- target: 18
  kind: amends
---

# Require exact RGBA visual parity with scoped exceptions

## Context and Problem Statement

The visual parity check compared screenshots with pixelmatch's perceptual threshold and an allowed difference ratio of 0.5%. A zero ratio still did not require identical images: anti-aliased or small color differences were omitted by pixelmatch, and images of different sizes could pass after background padding. In a local audit of 198 light/dark screenshots, 44 image pairs had decoded RGBA differences, including 20 pairs that pixelmatch reported as zero differences. Repeated captures of 12 representative pairs were identical within the same local browser environment.

## Decision Drivers

* A passing visual check must mean the images have the same dimensions and decoded RGBA values.
* Intentional implementation differences must stay narrow and reviewable.
* The parity job must use a reproducible browser environment, while functional browser tests still exercise current Chrome.
* A future maintainer must be able to identify and remove each exception.

## Considered Options

* Keep a perceptual pixelmatch threshold and lower the default ratio to zero.
* Allow a raw RGBA difference count for each scenario.
* Require exact dimensions and decoded RGBA, with documented rectangular exceptions.

## Decision Outcome

Chosen option: "Require exact dimensions and decoded RGBA, with documented rectangular exceptions". The comparator checks all four decoded channels at every coordinate and fails on any dimension mismatch. The default exception set is empty. A scenario may declare bounded image regions in the coverage registry with a reason; every pixel outside those regions must still match exactly. A visual diff and counts of total, allowed, and unallowed differences remain available for review. PNG file bytes are not compared because compression and metadata do not affect rendered pixels.

The only retained exception is the narrow right-edge scrollbar region of ScrollArea. Its native CSS scrollbar differs from the upstream Radix scrollbar by design; a browser system spec verifies that the native viewport can scroll. The region should be removed if the scrollbar implementations converge or the preview can represent the same state without hiding a meaningful difference.

The dummy Tailwind CSS and upstream Vite CSS are both minimized so equivalent shadow alpha values compile to the same color. The parity CI job pins Ubuntu 24.04 and Chromium snapshot 1704574 (Chromium 156.0.8074.0, as used by the successful parity run on 2026-09-25). The separate system job continues to run current Chrome. A browser snapshot update requires a full parity run and review of every exception.

### Consequences

* Good, because a zero-difference result now proves dimension and decoded RGBA equality outside explicitly named regions.
* Good, because one-channel differences and anti-aliasing differences can no longer disappear behind a perceptual threshold.
* Good, because the scrollbar difference stays visible and separately documented.
* Bad, because browser and CSS toolchain updates may require a reviewed snapshot update or component correction.
* Bad, because an exception region cannot detect changes confined to that region; the ScrollArea scrolling test covers its essential behavior.

### Confirmation

The comparator tests cover one-unit changes in each RGBA channel, dimension mismatch, and differences inside and outside an allowed region. The registry contract validates the exception shape and reason. The parity job compares all declared light/dark scenarios and uploads screenshots and diff reports on failure. The ScrollArea system spec verifies native scrolling.

## More Information

This decision amends [ADR 0012](0012-verify-compatibility-through-layered-automated-testing.md) by defining what visual parity means, and [ADR 0018](0018-define-a-support-matrix-and-verify-it-without-a-ci-matrix.md) by pinning the parity browser while retaining the latest-Chrome system job. Commands and exception handling are documented in the [testing reference](../reference/testing.md).
