# Task 138 — Report learning-set readiness

## Goal

Distinguish lexical quality from the ability to start a useful learning session and expose an
actionable set-level diagnosis to the learner.

## Acceptance criteria

- Report lexical, contextual-example, exercise, and requested-count coverage separately.
- Classify the set as `ready`, `partial`, or `blocked`.
- Never call a set ready when fewer than four candidates can produce an exercise.
- Distinguish verified examples from provisional generated examples.
- Return reason codes and learner-facing recommendations.
- Preserve the existing lexical `qualitySummary` contract.
- Show the readiness diagnosis during review without exposing answers.
