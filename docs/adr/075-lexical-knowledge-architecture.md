# ADR-075 — Lexical Knowledge Architecture

## Status

Accepted.

## Context

The current generation flow treats a published cloze exercise as the proof that a lexical candidate
is usable. Manual testing showed that valid, contextually appropriate words can be blocked when an
official example is unavailable or when the candidate set cannot provide three compatible cloze
distractors.

The product needs a durable representation of lexical knowledge that remains useful independently of
any one exercise strategy.

## Decision

`WordKnowledge` becomes the central resolved lexical artifact.

The architecture separates three responsibilities:

1. **Lexical sources provide evidence.** Definitions, senses, examples, pronunciation, frequency,
   CEFR classifications, and provenance originate from source adapters.
2. **AI or the learner makes a contextual decision.** The selector may choose only a `senseId`
   present in lexical evidence. It records confidence, reason codes, and who made the decision.
3. **The pedagogical engine derives capabilities.** Exercise availability is calculated from
   resolved knowledge. Failure to compose a cloze does not invalidate lexical knowledge.

AI-generated adaptations must retain the original evidence and provenance. AI must not invent a
lexical sense, official CEFR classification, or source attribution.

## Initial contract

Task 075 introduces the domain contract and invariant builder only. It does not migrate generation
drafts or change the user interface.

The initial contract contains:

- stable knowledge and candidate identifiers;
- selected and alternative lexical senses;
- contextual selection metadata;
- lexical, example, pronunciation, CEFR, and frequency evidence;
- explicit exercise capabilities;
- deduplicated provenance.

## Migration strategy

1. Build `WordKnowledge` alongside the current `EnrichedCandidate`.
2. Add contextual sense selection.
3. persist resolved knowledge in generation drafts;
4. calculate exercise capabilities;
5. publish exercises using multiple strategies;
6. remove exercise publication as a prerequisite for lexical resolution.

This incremental migration keeps the existing API and study-session runtime operational.
