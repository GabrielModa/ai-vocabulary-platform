# Task 085 — Draft Resolution Integration

## Objective

Use persistent definition-choice publication as a fallback during trusted draft review resolution.

## Acceptance criteria

- Reviewed candidates are resolved into `WordKnowledge` from trusted lexical senses.
- The reviewed candidate pool supplies deterministic definition-choice distractors.
- Successful publications are mapped into `PublishedExerciseSelection`.
- Legacy cloze publication remains the preferred outcome.
- Definition choice replaces legacy fallback/reject outcomes when available.
- No client-provided exercise content is trusted.
- Insufficient compatible pools remain rejected.
- Focused domain and web tests, typecheck, lint, build, and formatting pass.
