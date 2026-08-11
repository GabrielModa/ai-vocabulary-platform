# ADR 104 — Preserve CMUdict ARPABET as the verified notation

## Status

Accepted.

## Decision

The local CMUdict adapter returns the source ARPABET transcription for American English without
converting it to IPA or an improvised learner hint. The adapter validates the finite CMU phoneme
inventory, requires stress on vowel phonemes, rejects stress on consonants, preserves source order
for alternate pronunciations, and attaches dataset-level license and attribution to every result.

Unknown words and dialects outside `en-US` produce an empty result. This is an honest absence of
evidence, not an invitation for the language model to invent a transcription.

## Consequences

The UI may label this notation as verified US ARPABET, but browser speech synthesis remains a
separate audio facility. A future IPA source or licensed recording provider must use its own adapter
and provenance rather than deriving claims silently from this dataset.
