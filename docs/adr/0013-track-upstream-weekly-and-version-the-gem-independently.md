---
number: 13
title: Track upstream weekly and version the gem independently
status: accepted
date: 2026-09-03
---

# Track upstream weekly and version the gem independently

## Context and Problem Statement

The upstream registry changes continuously and does not assign component versions that can be mirrored by the gem. The project needs a predictable review cadence, release numbering, and failure policy without merging unverified generated output.

## Decision Drivers

* Detect upstream drift soon enough without creating daily review noise.
* Keep only verified updates in pull requests.
* Preserve a traceable mapping from gem releases to upstream snapshots.
* Express Rails API compatibility independently from upstream content changes.

## Considered Options

* Update manually when a user reports drift.
* Mirror upstream tags as gem versions.
* Run weekly synchronization, open one verified update pull request, and use independent semantic versioning.

## Decision Outcome

Chosen option: "Run weekly synchronization, open one verified update pull request, and use independent semantic versioning". A scheduled and manually dispatchable workflow syncs, generates, and verifies before creating or updating one drift pull request. Failed sync or verification creates no PR. The workflow uses `github.token`, avoids privileged pull-request steps, and pins external actions.

The gem uses its own semantic version. The changelog and vendored manifest identify the upstream snapshot. API removals follow the gem's deprecation and major-version policy rather than an upstream component version.

### Consequences

* Good, because upstream changes arrive as bounded, reviewable work.
* Good, because broken generated states are not proposed automatically.
* Good, because gem consumers receive meaningful API versioning.
* Bad, because drift can remain unreviewed for up to one scheduling interval.
* Bad, because large upstream redesigns still require a deliberately managed major update.

### Confirmation

Workflow contract tests verify triggers, token use, pinned actions, verification order, and PR behavior. Release checks compare changelog, manifest, version, and generated state.

## More Information

Current CI and release procedures are documented in [CI and drift detection](../reference/ci-drift-detection.md).
