# ADR-0053 — Definition-choice cross-POS fallback

## Status

Accepted

## Context

Definition-choice publication required three distractors with the same part of speech as the target.
A reviewed set containing `referee`, `coach`, `penalty`, and `tackle` therefore published nothing:
each noun had only two noun alternatives and the verb had none. All four meanings were verified, so
blocking the session did not improve factual safety.

## Decision

Definition-choice distractor selection continues to rank same-part-of-speech knowledge first with a
1,000-point preference. When fewer than three are available, it fills the remaining positions with
other resolved, definition-verified knowledge from the reviewed set. Cross-POS items receive the
explicit `cross-part-of-speech-fallback` reason and no POS bonus.

All existing identity, lemma, display-form, sense, and definition deduplication remains mandatory.
The change applies only to word-to-definition multiple choice. Verified cloze composition retains
its stricter grammatical compatibility rules.

## Consequences

- Small mixed-POS sets can start training instead of failing after review.
- Larger pools still prefer three same-POS alternatives whenever available.
- Every answer and distractor remains bound to verified lexical knowledge; the LLM is not promoted
  to factual authority.
- Cross-POS alternatives can be easier, which is preferable to an unusable session and can later be
  replaced by a larger curated distractor bank.
