# ADR 0021: Generated study examples are provisional enrichment

## Status

Accepted on 2026-08-12.

## Decision

When a selected, verified lexical sense has no licensed corpus example, the application may ask the
local Ollama model for one example sentence. Missing examples are generated in one bounded batch
after lexical selection. Each request includes only the candidate id, term, part of speech, selected
sense id and definition, requested CEFR level, and normalized topic.

Generated sentences must pass deterministic structural validation and are stored with
`generated: true` and `validationStatus: provisional`. They are never inserted into
`verifiedExamples`, never replace a verified corpus example, and are disclosed in Study mode as an
AI-generated example. A model failure does not invalidate the verified vocabulary set.

## Consequences

- Study mode remains useful when the licensed local example index has sparse coverage.
- Lexical facts remain controlled by the verified provider; the model writes language around a
  selected sense instead of inventing the sense.
- Generated examples are not sufficient evidence for publishing verified cloze exercises. That
  requires a separately documented validator or a licensed corpus source.
- Candidate selection stays fast because trusted topic selection still avoids an unnecessary LLM
  call; the extra request is a single batch and only covers missing examples.
