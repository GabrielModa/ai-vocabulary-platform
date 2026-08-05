# ADR-081 — Definition Choice Composer

## Status

Accepted.

## Context

The current exercise pipeline can reject valid lexical knowledge when no verified cloze can be
published. Task 080 established that a verified definition is sufficient for a definition-choice
capability.

## Decision

Introduce a pure `DefinitionChoiceComposer`.

The composer receives one target `WordKnowledge`, its capability plan, and exactly three distractor
knowledge items. It creates a definition-to-word multiple-choice exercise using the target's
official definition and source provenance.

Distractors must:

- be unique by normalized display form and knowledge ID;
- share the target part of speech;
- already be resolved `WordKnowledge` items.

The composer does not use AI, shuffle choices, persist content, or publish to a study session.
Deterministic ordering makes the domain result reproducible; presentation-layer shuffling may happen
later while retaining stable choice IDs.

## Consequences

A resolved word can produce a valid exercise without an official cloze example. Task 082 will select
compatible distractors and integrate this composer into multi-strategy publishing.
