---
number: 11
title: Type runtime Ruby with Sorbet strict
status: accepted
date: 2026-09-03
---

# Type runtime Ruby with Sorbet strict

## Context and Problem Statement

Generated contracts and a broad public component API create many Ruby boundaries where a renamed option or changed return shape could fail late. Applying Sorbet indiscriminately to Rails templates and test tooling, however, would add substantial maintenance cost.

## Decision Drivers

* Check the shipped Ruby API and generated Ruby contracts statically.
* Keep untyped values at narrow Rails and HTML attribute boundaries.
* Avoid a typing toolchain for ERB and test-only code without a clear return.
* Make generated typing failures the generator's responsibility.

## Considered Options

* Do not use static Ruby typing.
* Use `typed: strict` for shipped runtime Ruby only.
* Attempt `typed: strong` and ERB typing across the entire repository.

## Decision Outcome

Chosen option: "Use `typed: strict` for shipped runtime Ruby only". Files under `app/` and `lib/`, including generated Ruby, are checked. Specs, the dummy application, and extractor tooling remain outside the Sorbet target. `T.untyped` is permitted only at explicit framework and HTML attribute boundaries. ERB stays logic-light and is not processed by erbsorbet.

### Consequences

* Good, because public signatures and contract lookups are checked before release.
* Good, because generated code follows the same runtime quality bar.
* Good, because Rails template typing does not dominate maintenance.
* Bad, because templates and tests do not receive static coverage.
* Bad, because RBI updates remain part of dependency maintenance.

### Confirmation

CI runs `srb tc`; generated Ruby contains signatures; RuboCop enforces typed sigils and Sorbet conventions in the configured scope.

## More Information

The exact boundaries and typing patterns are documented in [Sorbet policy](../reference/sorbet.md).
