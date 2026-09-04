---
number: 3
title: Package components as a Rails engine gem
status: accepted
date: 2026-09-03
---

# Package components as a Rails engine gem

## Context and Problem Statement

The library must deliver server-rendered components, styles, and optional browser behavior to Rails applications without copying component source into each host. Its distribution boundary also determines which framework versions and runtime dependencies the project must support.

## Decision Drivers

* Integrate with Rails autoloading, ViewComponent, assets, generators, and import maps.
* Keep installation explicit and repeatable across host applications.
* Avoid requiring Node.js or a browser build tool at gem runtime.
* Limit the compatibility matrix while the project and its public API are still evolving.

## Considered Options

* Publish an isolated Rails engine gem.
* Copy generated component source into each application.
* Publish separate Ruby, CSS, and JavaScript packages.

## Decision Outcome

Chosen option: "Publish an isolated Rails engine gem". The gem requires Ruby 4.0 or newer, Rails 8.1 or newer, ViewComponent 4.0 or newer, and `tailwindcss-rails` 4.3 or newer. It owns the component classes, generated contracts, styles, JavaScript modules, and installer. Node.js remains a repository development dependency and is not required by a consuming application at runtime.

### Consequences

* Good, because Rails owns component loading and asset integration through established engine mechanisms.
* Good, because consumers install and upgrade one versioned package.
* Good, because the host does not need the extractor toolchain.
* Bad, because applications on older Ruby, Rails, ViewComponent, or Tailwind integrations are outside the support matrix.
* Bad, because engine integration behavior must be tested against Rails packaging and host-application boundaries.

### Confirmation

The gemspec enforces the dependency floor. Engine distribution, generated gem contents, and a consumer installation are checked by contract and integration tests.

## More Information

The current package layout and editing boundaries are described in [Architecture](../reference/architecture.md).
