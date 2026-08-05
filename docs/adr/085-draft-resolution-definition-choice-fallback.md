# ADR-085 — Draft Resolution Definition-Choice Fallback

## Status

Accepted.

## Context

Reviewed draft resolution still invokes only the legacy cloze pipeline. When selected lexical senses
lack a target-bearing official example, all candidates are rejected and the endpoint returns
`no-published-exercises`, even though the same reviewed knowledge can support definition-choice
exercises.

## Decision

Add an application service that converts reviewed `LearningCandidate` values into resolved
`WordKnowledge`, publishes definition-choice exercises from the reviewed pool, and maps successful
publications into the persistent exercise union introduced in Task 084.

`resolveReview` keeps legacy cloze publication as the first choice. For candidates not published by
the legacy pipeline, it uses the new definition-choice result as a deterministic fallback.

The fallback uses only trusted server-side draft content and the learner-confirmed sense selection.
No client-provided definition, option, answer, or provenance is accepted.

## Consequences

A reviewed set containing at least four compatible resolved knowledge items can produce persistent
definition-choice exercises even when no cloze can be published. Existing valid cloze exercises keep
their current behavior.
