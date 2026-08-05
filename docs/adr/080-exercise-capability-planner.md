# ADR-080 — Exercise Capability Planner

## Status

Accepted.

## Context

Resolved lexical knowledge is currently blocked by whether the cloze pipeline can publish an
exercise. A valid word and sense must remain teachable even when no official target-bearing example
exists.

## Decision

Introduce a deterministic `ExerciseCapabilityPlanner`.

The planner derives exercise availability from `WordKnowledge` evidence:

- a verified definition enables `definition-choice` and `word-definition-match`;
- an official example containing the normalized lemma as a complete lexical token enables
  `verified-cloze`;
- pronunciation evidence enables `audio-recognition`;
- image and collocation capabilities remain unavailable until dedicated evidence is modeled.

Every unavailable capability includes an explicit reason code. The planner does not call AI and does
not generate, validate, or publish exercises.

## Consequences

Exercise composition can choose the strongest available strategy instead of treating cloze
availability as lexical validity. Task 081 will consume this plan to compose a definition-choice
exercise when cloze is unavailable.
