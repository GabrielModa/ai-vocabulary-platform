# Task 055 — Deterministic distractor selection

## Goal

Select three reproducible distractors from verified lexical candidates without asking a language
model to invent alternatives.

## Acceptance criteria

- The answer requires a confirmed lexical sense.
- Only candidates with confirmed senses are eligible.
- Distractors must share the answer's part of speech.
- The answer lemma, duplicate lemmas, and identical senses are excluded.
- Frequency-supported candidates are ordered by absolute percentile distance.
- Candidates without frequency remain eligible after supported candidates.
- Ties use stable candidate IDs.
- Insufficient candidates return a typed failure.
- Inputs remain immutable.
- No AI, React, network, provider lookup, database, randomness, or dependency is added.

## Verification

- Focused distractor-selection tests.
- Vocabulary package typecheck, lint, and build.
- Repository gates before commit.

## Next checkpoint

Compose deterministic distractor selection with the sense-bound cloze builder and validate that only
one option fits the verified sentence. AI becomes fallback only when deterministic composition
cannot produce a valid item.
