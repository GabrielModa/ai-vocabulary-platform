# Task 141 — Pedagogical distractor quality gate

## Goal

Stop definition-choice exercises from being published when the alternatives make the answer obvious
through part of speech or a broad semantic category rather than vocabulary knowledge.

## Problem observed

A real A2 football session published options such as `ball / team / match / player`. All four words
were on-topic nouns, but they represented an object, a group, an event and a person. The learner
could answer by category elimination, so a correct response would be weak evidence of lexical
mastery.

## Acceptance criteria

- Never use cross-part-of-speech fallback distractors for definition-choice.
- For concrete, reliably detectable roles (`person`, `group`, `object`, `event`, `place`), require
  distractors to share the target role.
- Keep abstract/uncertain definitions on the existing deterministic scoring path rather than
  pretending semantic classification is certain.
- Preserve exact uniqueness checks for lemma, display form, sense and definition.
- Fail closed with `insufficient-compatible-knowledge` when the current pool cannot produce three
  pedagogically credible alternatives.
- Add a regression test for the observed football pattern.
- Do not use an LLM as the authority for semantic correctness.

## Follow-up

Task 142 should expand the distractor pool beyond the learner's selected set so this stricter gate
can publish strong alternatives such as `player / coach / referee / fan` without lowering the
quality bar.
