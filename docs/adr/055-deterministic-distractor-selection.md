# ADR-055 — Deterministic distractor selection

## Status

Accepted.

## Context

Task 054 can build a safe cloze from a confirmed sense and verified example, but it still requires
three externally supplied distractors. Letting the language model invent those options would
preserve a major source of ambiguity and duplicate answers.

The system already has verified lexical candidates, part-of-speech data, and optional SUBTLEX
frequency evidence.

## Decision

Add a pure domain selector that chooses distractors from verified candidates using:

1. confirmed lexical senses only;
2. the same part of speech as the answer;
3. a different `senseId` and normalized lemma;
4. smallest absolute SUBTLEX percentile distance when both values exist;
5. stable `candidateId` ordering as a deterministic tie breaker.

Candidates without frequency evidence remain eligible but sort after frequency-supported candidates.
The selector returns a typed failure when the pool cannot provide the requested count.

## Alternatives rejected

- Ask the LLM for alternatives: non-deterministic and difficult to audit.
- Use random candidates: unstable tests and poor pedagogical consistency.
- Match only by string shape: ignores lexical compatibility.
- Require frequency evidence for every candidate: unnecessarily reduces coverage.
- Select in React or the API route: duplicates domain rules.

## Consequences

Most distractor selection can happen without AI. The result is explainable and reproducible.
Part-of-speech compatibility is necessary but not sufficient to prove that only one option fits a
sentence. A later validator must test sentence-level uniqueness before an exercise is marked ready.

## Rollback

Remove the selector, tests, export, ADR, and Task 055 document. Task 054 continues accepting
externally supplied distractors.
