# ADR-090 — Reviewed Learning MVP Architecture Freeze

## Status

Accepted.

## Context

Tasks 076–089 established a complete reviewed learning flow: lexical evidence, contextual sense
resolution, immutable word knowledge, exercise capability planning, definition-choice publication,
persistent mappings, strategy orchestration, unified runtime behavior, and authenticated HTTP
validation.

The repository README still described the project as infrastructure-only, and there was no single
command defining the release gate for this product baseline.

## Decision

Freeze the reviewed learning MVP at Task 090.

The freeze introduces:

- an explicit baseline document defining supported behavior and invariants;
- an updated README reflecting implemented product capabilities;
- a root `mvp:verify` command covering the critical reviewed-learning tests and web quality gates.

The frozen architecture keeps these boundaries:

- AI proposes candidates and contextual decisions;
- trusted lexical evidence bounds selectable senses;
- domain contracts create immutable knowledge and exercises;
- review resolution publishes only validated persistent exercises;
- snapshots remain authoritative for runtime and scoring;
- HTTP responses expose exercise prompts and options, never answers.

Future exercise kinds and lexical providers must extend these boundaries instead of bypassing them.

## Consequences

The project now has a reproducible definition of “MVP complete.” Feature work after Task 090 can
focus on learner adaptation, CEFR quality, additional evidence sources, scheduling, metrics, and
production operations without reopening the core reviewed-learning pipeline.

Any incompatible change to the frozen invariants requires a new ADR and an updated release gate.
