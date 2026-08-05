# ADR-074 — Review-bound draft resolution

## Status

Accepted.

## Decision

Generation drafts preserve the enriched server evidence required to resolve reviewed lexical senses.
Review never mutates the source draft. `POST /api/vocabulary/drafts/:id/resolve` validates each
`candidateId + senseId` against the learner-owned source draft, reconstructs verified learning
candidates, runs the existing verified exercise pipeline, and saves a new immutable resolved draft.

The browser cannot provide definitions, provenance, examples, answers, or publication outcomes.
Study-session creation continues to accept only server-published exercises.
