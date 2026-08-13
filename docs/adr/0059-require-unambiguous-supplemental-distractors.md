# ADR-0059: Supplemental definition-choice distractors must be unambiguous

## Status

Accepted on 2026-08-13.

## Context

ADR-0058 correctly rejects definition-choice exercises whose distractors differ by broad semantic
role or part of speech. The reviewed publication layer, however, only used learner-selected
candidates as its pool. A broader pool is needed, but automatically selected contextual senses have
already shown that ambiguity can produce the wrong lexical interpretation.

## Decision

Reviewed publication may consume non-reviewed lexical source candidates as supplemental distractors
only when the source has exactly one verified sense matching the declared part of speech and
containing a verified definition.

Supplemental candidates:

- are never targets;
- are never treated as learner selections;
- use `single-verified-sense` as the resolution authority;
- still pass through the deterministic distractor quality gate from ADR-0058;
- are excluded entirely when their lexical source is ambiguous.

## Consequences

The publication layer can safely benefit from a larger stored source pool without weakening lexical
authority. Generation still needs a separate follow-up to persist additional hidden trusted-first
candidates when the learner-selected set exhausts the available pool.
