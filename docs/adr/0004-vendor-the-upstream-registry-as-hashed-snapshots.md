---
number: 4
title: Vendor the upstream registry as hashed snapshots
status: accepted
date: 2026-09-03
---

# Vendor the upstream registry as hashed snapshots

## Context and Problem Statement

shadcn/ui registry items are served as current content rather than independently versioned component releases. Reproducible generation therefore cannot depend on fetching the public registry during every build.

## Decision Drivers

* Reproduce generated outputs from a known upstream state.
* Make upstream changes visible in ordinary Git review.
* Record the origin and integrity of every registry item.
* Keep network access out of extraction and normal runtime use.

## Considered Options

* Fetch the latest registry during every generation.
* Track the upstream repository as a Git submodule.
* Commit registry item snapshots with a manifest and content hashes.

## Decision Outcome

Chosen option: "Commit registry item snapshots with a manifest and content hashes". `rake shadcn:sync` is the only writer of upstream snapshots under `vendor/shadcn/`. The manifest records source information and each item's SHA-256. Extraction reads only this committed state. Restoring an older upstream state uses Git history rather than a second pinning mechanism.

Local registry items are allowed only as explicit `local-override` entries in the same manifest and pipeline. They are not disguised as upstream content.

### Consequences

* Good, because the same snapshot produces the same extractor input without network access.
* Good, because reviewers can compare the raw upstream and derived contract changes in one commit.
* Good, because hashes provide an item-level integrity and review boundary.
* Bad, because upstream registry content increases repository size.
* Bad, because synchronization must adapt when upstream index or item formats change.

### Confirmation

Sync and integrity tests verify manifest coverage, item hashes, origins, and the absence of untracked registry inputs. Extraction fails when the snapshot is invalid.

## More Information

The current manifest and task contracts are described in [Upstream synchronization](../reference/upstream-sync.md).
