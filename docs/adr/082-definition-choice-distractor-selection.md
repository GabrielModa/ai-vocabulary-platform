# ADR-082 — Definition Choice Distractor Selection

## Status

Accepted.

## Context

The definition-choice composer requires exactly three resolved `WordKnowledge` distractors. The
existing distractor selector works on earlier `LearningCandidate` contracts and cannot be consumed
directly by the new knowledge-driven exercise engine.

## Decision

Introduce a deterministic `DefinitionChoiceDistractorSelector` operating on resolved
`WordKnowledge`.

Candidates are compatible only when they:

- share the target part of speech;
- have a different knowledge ID, normalized lemma, display form, sense ID, and definition;
- retain a non-empty verified selected definition.

Compatible candidates receive a deterministic score based on:

- matching learner level;
- matching topic;
- frequency similarity when percentile evidence is available;
- display-form length similarity.

Ties are resolved by stable knowledge ID ordering. The selector returns the original immutable
`WordKnowledge` items for direct use by the definition-choice composer.

The selector does not call AI, persist results, or publish exercises.

## Consequences

Definition-choice composition can be assembled deterministically from a resolved knowledge pool.
Task 083 can now combine capability planning, distractor selection, and composition in the real
publishing pipeline.
