# Task 090 — Reviewed Learning MVP Freeze

## Objective

Freeze the reviewed vocabulary-learning MVP with an explicit architecture baseline and reproducible
release gate.

## Acceptance criteria

- The README reflects the implemented MVP rather than an infrastructure-only phase.
- A baseline document records the product flow, supported exercises, and frozen invariants.
- The root package exposes `pnpm mvp:verify`.
- The release gate runs critical reviewed-learning and HTTP-flow tests.
- The gate runs web typecheck, lint, production build, and repository formatting.
- Extension rules protect lexical evidence, persistent exercises, immutable snapshots, and
  answer-free public responses.
- ADR 090 records the architecture freeze.
- No runtime behavior changes.
