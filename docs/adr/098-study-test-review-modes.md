# ADR 098 — Study and Test review modes

## Status

Accepted.

## Context

The review screen protected retrieval practice by hiding definitions and examples, but learners had
no explicit way to choose guided study. An unlabeled mixture of visible answers and testing would
make passive exposure the default and weaken the intended learning loop.

## Decision

Review begins in Test mode. It exposes the word, part of speech, selection, and word audio without
showing meaning or examples. Study mode explicitly reveals the existing candidate meaning, example,
and distinct contexts, each with its own audio action.

The UI never generates or rewrites lexical facts. Ambiguous sense confirmation remains a separate
required action and cannot be bypassed by changing review mode.

## Consequences

- Retrieval-first behavior remains the default.
- Learners can deliberately switch to dual-coded study when they need support.
- The mode is session UI state and does not alter mastery or persisted lexical records.
- Candidate editing remains a future validated workflow; the previous inert Edit control is removed
  instead of implying unsupported behavior.
