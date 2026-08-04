# ADR-054 — Deterministic sense-bound cloze construction

## Status

Accepted.

## Context

The platform now has a confirmed lexical sense and licensed OEWN examples for that exact sense.
Exercise text is still allowed to originate from model-generated content, which can create generic
sentences, multiple valid answers, duplicate options, or examples tied to the wrong meaning.

## Decision

Introduce a pure domain builder that constructs a cloze only when:

- the candidate has a confirmed lexical sense;
- the example has the same `senseId`;
- the normalized lemma appears as one complete token exactly once;
- exactly three non-empty, unique distractors are supplied;
- the final exercise contains one gap and four unique options.

The builder returns a typed failure instead of throwing for expected content-quality problems. It
preserves the original verified sentence and source record ID for auditability. It performs no model
call and does not regenerate content.

## Alternatives rejected

- Generate the full exercise with the LLM: non-deterministic and difficult to validate.
- Replace every substring occurrence: can damage larger words and create multiple gaps.
- Match examples by lemma without `senseId`: risks teaching the wrong meaning.
- Silently choose the first valid occurrence: hides ambiguous source material.
- Integrate directly in React or the API route: duplicates pedagogical rules outside the domain.

## Consequences

Verified examples can now become safe exercise templates without using AI. Distractor selection is
intentionally left separate because it will require part-of-speech, frequency, level, and lexical
compatibility evidence. Invalid examples are rejected individually, allowing a later orchestrator to
try the next verified example rather than regenerate the whole set.

## Rollback

Remove the cloze builder, tests, export, ADR, and Task 054 document. Verified examples remain
available as study content.
