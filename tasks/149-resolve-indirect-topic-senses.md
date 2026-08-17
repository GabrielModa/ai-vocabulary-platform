# Task 149 — Resolve indirect topic senses

Remove unnecessary learner confirmation when a trusted topic implies a unique verified sense through
auditable semantic evidence rather than a literal topic word.

## Allowed files

- `packages/vocabulary/src/contextual-sense-selector.ts`
- `packages/vocabulary/src/contextual-sense-selector.test.ts`
- `tasks/149-resolve-indirect-topic-senses.md`

## Acceptance criteria

- Football `formation` selects the verified spatial-arrangement sense from the real set of competing
  definitions without model inference.
- The semantic expansion remains narrow enough that the generic arrangement and creation senses do
  not tie with or outrank the football sense.
- Weak and tied contextual evidence still requires learner review.
- The decision remains deterministic, explainable, and backed only by verified lexical senses.
- Repository quality gates pass.

## Product decision

A trusted topic may carry a small, reviewed semantic vocabulary for indirect sense matching. These
tokens are evidence for ranking existing verified definitions; they never create or rewrite lexical
facts.
