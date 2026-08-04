# Task 059 — Strict AI fallback policy

## Goal

Decide whether an exercise may use AI fallback and generate a narrow, deterministic request contract
without calling a model.

## Acceptance criteria

- Ready exercises return `not-required`.
- Any structural issue prohibits AI.
- Missing provenance prohibits AI.
- Only context-quality failures allow AI.
- Allowed operation is `rewrite-context-only`.
- Answer, sense, options, and provenance cannot be changed.
- The request requires exactly one gap and minimum context.
- The output contract contains only source and gap sentences.
- Triggering reasons are unique and sorted.
- Request IDs are deterministic and versioned.
- Inputs are not mutated.
- No model, React, database, provider lookup, network, randomness, or dependency is added.

## Verification

- Focused AI fallback policy tests.
- Vocabulary package typecheck, lint, and build.
- Full repository gates before commit.

## Next checkpoint

Compose candidate evidence, examples, exercise composition, readiness, and fallback policy into one
domain exercise pipeline.
