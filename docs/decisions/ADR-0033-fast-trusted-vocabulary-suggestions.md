# ADR-0033 — Local AI suggests terms; trusted providers supply learning facts

## Status

Accepted.

## Context

The initial review request made a 3B CPU model generate definitions, examples, cloze prompts, and
three contexts for every candidate. Four words produced roughly 1,050 output tokens and took about
90 seconds inside Ollama, followed by additional AI calls for ambiguous sense selection. Much of
that generated content was then replaced or rejected by the verified lexical pipeline.

## Decision

The initial local-AI operation returns only exact-count candidate terms and proposed parts of
speech. A strict structured-output schema and output-token budget constrain the operation. The
application constructs honest pending states, then enriches candidates from Open English WordNet,
SUBTLEX, OEWN examples, and CMUdict.

Verified examples supply the primary example and up to three contexts. If a word has multiple
compatible verified senses, the learner chooses the intended sense during review; AI is not the
lexical authority. Identical normalized requests use a bounded, short-lived, process-memory cache.
No topic or result is persisted or logged by that cache.

## Consequences

- Review latency scales with short candidate JSON instead of full lesson content.
- Verified content quality and provenance are preserved or improved.
- Repeated identical requests are immediate within one local runtime.
- A first request for an arbitrary topic still depends on local CPU inference and cannot be truly
  instantaneous.
- Words without sufficient verified evidence remain honest pending/unavailable candidates and cannot
  silently become trusted exercises.
