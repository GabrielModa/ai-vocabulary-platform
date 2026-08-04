# Task 060 — Unified verified exercise pipeline

## Goal

Expose one deterministic domain operation that produces a publish, AI-fallback, or reject outcome.

## Acceptance criteria

- Composition is the first stage.
- Composition failures return `reject` with typed causes.
- Ready exercises return `publish`.
- Context-repairable exercises return `request-ai-fallback`.
- Structural-policy failures return `reject`.
- AI requests remain restricted to context rewriting.
- Every outcome is versioned.
- Semantic uniqueness remains explicitly not proven.
- Identical input produces identical output.
- Inputs are not mutated.
- No AI call, provider lookup, React, database, network, randomness, or dependency is added.

## Verification

- Focused unified-pipeline tests.
- Vocabulary package typecheck, lint, and build.
- Full repository gates before commit.

## Next checkpoint

Integrate the unified pipeline into the vocabulary generation API and expose typed per-candidate
outcomes without breaking provisional candidates.
