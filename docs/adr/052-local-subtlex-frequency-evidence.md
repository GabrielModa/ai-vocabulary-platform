# ADR-052 — Local SUBTLEX frequency evidence

## Status

Accepted.

## Context

The deterministic ranking engine is active in production, but it currently ranks with lexical
verification only. When two candidates have the same lexical status, ordering falls back to the
candidate ID. A real usage-frequency source can make ranking more pedagogically useful and reduce
the influence of the local language model.

A runtime Python dependency, a remote API, and committing a large dataset were rejected because they
would weaken the existing local-first and reproducible architecture.

## Decision

Add a provider-neutral frequency contract and a local SUBTLEX-US adapter.

The implementation:

- imports a user-supplied SUBTLEX-compatible CSV or TSV into a compact local JSON index;
- keeps the source dataset and generated index under `data/subtlex/`, outside Git;
- validates metadata and every returned record with Zod;
- carries source, version, license, attribution, retrieval time, and source ID;
- returns normalized percentile and frequency-per-million evidence;
- passes the percentile into the existing domain ranking engine;
- exposes frequency evidence in the server response for auditability;
- fails soft when the index is absent or malformed.

The source adapter is based on the SUBTLEX-US frequency list distributed by
`words/subtlex-word-frequencies`. Its repository declares the package and list under ISC and credits
the original SUBTLEX-US corpus authors.

## Alternatives rejected

- `wordfreq`: strong coverage, but its combined data is CC BY-SA and its maintainers explicitly warn
  against flattening it into CSV because attribution can be separated from the data.
- A paid COCA list: redistribution and exact-frequency display restrictions conflict with the
  product architecture.
- A remote frequency API: introduces latency, availability, privacy, and vendor-dependency risks.
- Hard-code frequency bands: unverifiable and difficult to update.
- Commit the full index: unnecessary repository growth and licensing risk.

## Consequences

Candidate order can now use verified usage evidence without a model call. The product remains fully
functional when SUBTLEX data is unavailable; it simply falls back to lexical-only ranking.

Frequency is word-form evidence, not sense-specific evidence. It must not be presented as proof of a
particular lexical sense or as a CEFR classification.

## Rollback

Remove the frequency module, import script, route loader, enrichment evidence, tests, ADR, and Task
052 document. The Task 051 lexical-only ranking remains intact.
