---
number: 18
title: Define a support matrix and verify it without a CI matrix
status: accepted
date: 2026-09-04
---

# Define a support matrix and verify it without a CI matrix

## Context and Problem Statement

The gemspec declared only lower bounds (`rails >= 8.1`, `view_component >= 4.0`, uncapped `tailwind_merge` and `sorbet-runtime`), while CI ran every job in a single mise environment pinned to the newest resolved versions. Installable therefore did not mean verified: consumers could resolve combinations this project had never tested, and nobody could tell which version breakage counts as in scope. Issue [#31](https://github.com/supermomonga/shadcn_view_components/issues/31) asked for a documented support matrix enforced by CI, with the owner constraining the solution because of cost: run tests basically on the latest releases only. Reproducibility of the JS toolchain was already a proven concern (a floating `pnpm latest` had broken CI before being pinned), and the `node = "lts"` mise alias would silently move to Node 26 in October 2026. Browser requirements (`<dialog>`, Popover API, modern CSS) were undocumented.

Resolving the minimum combination surfaced a concrete lie in the old floors: view_component 4.0.x requires `activesupport < 8.1`, so `rails >= 8.1` with `view_component >= 4.0` was an unsatisfiable declaration. The lowest view_component that resolves against Rails 8.1 is 4.1.0.

## Decision Drivers

* Support claims must be verifiable; the gemspec must not admit major versions or combinations that CI has never tested.
* CI cost must stay bounded; the owner directed that verification run basically on the latest release versions.
* Browser support follows the native-API-first design ([ADR 0008](0008-reimplement-client-behavior-with-stimulus-and-native-html.md)); no polyfill layer will be maintained.
* The development toolchain must be reproducible across time and machines (Node LTS alias drift, prior pnpm breakage).

## Considered Options

* Full CI matrix of minimum × latest combinations for Ruby, Rails, and Node.
* Latest-only CI with floors declared in the gemspec but never executed.
* Latest-only CI plus a minimum floor re-run inside existing jobs.

## Decision Outcome

Chosen option: "Latest-only CI plus a minimum floor re-run inside existing jobs". The canonical matrix lives in the [support matrix reference](../reference/support-matrix.md); the gemspec, CI workflow, and README all express the same ranges.

* Runtime dependencies use pessimistic operators that cap the next unverified major: `rails ~> 8.1`, `view_component ~> 4.1`, `tailwindcss-rails ~> 4.3`, `tailwind_merge ~> 1.5`, `sorbet-runtime ~> 0.6`. Ruby keeps a floor-only `>= 4.0.0` (community convention) and supports the 4.0 series only.
* `gemfiles/minimum.gemfile` pins the floor combination (rails 8.1.0, view_component 4.1.0, tailwindcss-rails 4.3.0, tailwind_merge 1.5.0). `VERIFY_MINIMUM=1`, set only in the `rspec` and `tailwind-build` CI jobs, re-runs the component, contract, and Tailwind engine distribution specs under that bundle. No new jobs, no matrix, and the job names required by branch protection are unchanged.
* Node is pinned to LTS major 24 in `mise.toml` (with an `engines` field in the root `package.json`); pnpm stays pinned at 10.22.0 as before.
* The browser floor is Baseline 2024; the binding constraint is the Popover API (Chrome/Edge 114+, Safari 17+, Firefox 125+). Newer CSS features degrade progressively and are listed as such. Automated browser verification remains latest-Chrome-only via the existing system and parity jobs.

### Consequences

* Good, because every version range the gemspec admits is either tested at its floor, tested at latest, or capped out until verified.
* Good, because the floor combination is actually executed, which exposed the view_component 4.0 incompatibility instead of leaving it declared.
* Good, because CI cost grows only by one extra bundle install and a lightweight spec re-run inside two existing jobs.
* Good, because the toolchain stops drifting when the next Node LTS ships.
* Bad, because the floor check is a smoke subset; regressions specific to intermediate minor releases between floor and latest can pass unnoticed.
* Bad, because Safari and Firefox support rests on API audit rather than automated execution.
* Bad, because every new major (Rails 9, view_component 5, Node 26) now requires an explicit gemspec or pin change before it can be used.

### Confirmation

`VERIFY_MINIMUM=1 bundle exec rake verify:spec verify:tailwind` executes the floor re-run locally; CI sets the same variable in the `rspec` and `tailwind-build` jobs. The pnpm toolchain contract spec keeps mise and every `packageManager` field on the same version, and the documentation link spec keeps README, gemspec comments, and the support matrix reference resolvable against tracked files.

## Pros and Cons of the Options

### Full CI matrix of minimum × latest combinations

* Good, because every supported boundary combination is executed.
* Bad, because it multiplies every expensive job (system, parity) across environments and contradicts the owner's cost direction.
* Bad, because it needs cache infrastructure this repository deliberately does not have yet.

### Latest-only CI with floors declared but never executed

* Good, because it is the cheapest option.
* Bad, because floor declarations can be unsatisfiable (as view_component 4.0 proved) and nobody would notice.
* Bad, because "minimum supported version builds and passes in CI" from the issue stays unmet.

## More Information

The canonical tables, progressive-enhancement inventory, and update procedures are maintained in [support matrix](../reference/support-matrix.md). Issue [#31](https://github.com/supermomonga/shadcn_view_components/issues/31) records the request and the owner's CI-cost direction. Related decisions: [ADR 0008](0008-reimplement-client-behavior-with-stimulus-and-native-html.md) (native browser APIs, hence no polyfills), [ADR 0012](0012-verify-compatibility-through-layered-automated-testing.md) (the layered verification the floor re-run extends).
