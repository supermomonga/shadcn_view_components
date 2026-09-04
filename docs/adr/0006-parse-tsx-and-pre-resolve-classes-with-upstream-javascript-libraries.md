---
number: 6
title: Parse TSX and pre-resolve classes with upstream JavaScript libraries
status: accepted
date: 2026-09-03
---

# Parse TSX and pre-resolve classes with upstream JavaScript libraries

## Context and Problem Statement

Registry sources express classes through TSX syntax, CVA variants, conditional `cn` calls, and Tailwind conflict resolution. Reimplementing those semantics in Ruby or extracting them with regular expressions would create silent visual differences.

## Decision Drivers

* Parse TSX structurally and reject unknown dynamic expressions.
* Match upstream CVA and `tailwind-merge` behavior.
* Keep the gem runtime simple and independent of JavaScript tooling.
* Produce deterministic, schema-validated contract data.

## Considered Options

* Parse TSX with regular expressions.
* Reimplement CVA and Tailwind merging in Ruby at runtime.
* Use a strict TypeScript AST extractor and precompute every finite variant combination.

## Decision Outcome

Chosen option: "Use a strict TypeScript AST extractor and precompute every finite variant combination". The extractor uses Babel's TypeScript/JSX parser, Zod validation, and the upstream-compatible CVA, `clsx`, and `tailwind-merge` libraries. It enumerates finite variant combinations during generation. Ruby performs table lookup and only merges consumer-supplied extra classes with the Ruby `tailwind_merge` gem.

Unknown dynamic syntax, invalid schemas, missing variants, and excessive combination counts fail explicitly instead of falling back to guessed output.

### Consequences

* Good, because generated class strings follow the same JavaScript implementations as upstream.
* Good, because Ruby runtime resolution is a small deterministic lookup.
* Good, because unsupported upstream syntax becomes an actionable extraction failure.
* Bad, because extractor maintenance requires a Node.js and TypeScript development toolchain.
* Bad, because combination tables increase generated artifact size.

### Confirmation

Extractor unit tests cover supported syntax and fixed fixtures. Contract validation, generation idempotence, and Ruby conformance tests verify the complete path.

## More Information

The accepted syntax and schema are documented in [Extraction and code generation](../reference/extraction-codegen.md).
