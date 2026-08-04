# Task 056 — Verified exercise composer

## Goal

Compose a deterministic exercise from a confirmed sense, verified examples, and verified candidate
pool without duplicating lower-level rules or calling AI.

## Acceptance criteria

- A confirmed answer sense is mandatory.
- Only examples with the exact answer `senseId` are considered.
- Distractors are selected by the Task 055 domain selector.
- Verified examples are tried in supplied order.
- The first valid cloze is returned.
- Rejected examples produce typed, auditable causes.
- Insufficient distractors remain a typed failure.
- Success carries lexical and example provenance.
- Exercise IDs are deterministic and versioned.
- Results and nested collections are immutable.
- Inputs are not mutated.
- No AI, React, database, provider lookup, network call, randomness, or dependency is added.

## Verification

- Focused composer tests.
- Vocabulary package typecheck, lint, and build.
- Full repository gates before commit.

## Next checkpoint

Add sentence-level unique-answer validation to distinguish structurally valid exercises from
semantically ready exercises.
