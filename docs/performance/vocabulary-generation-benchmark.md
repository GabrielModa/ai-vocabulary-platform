# Vocabulary generation benchmark

## Method

Run `pnpm benchmark:vocabulary` from the repository root. The smoke matrix requests six A2 football
terms and six B1 work terms. It executes the production trusted-first candidate adapter, the local
lexical indexes, deterministic ranking, quality validation, and deficit replacement. Ollama remains
available for fallback but is not called when the local catalog covers the request.

Durations use the process monotonic clock and are intended for comparative local development, not as
a cross-machine service-level objective.

## Baseline before trusted routing

Measured on this Windows development machine before local candidate routing:

| Stage                               |      p50 |       p95 |
| ----------------------------------- | -------: | --------: |
| Candidate suggestion through Ollama | 7,928 ms | 20,081 ms |
| Lexical enrichment and validation   |    15 ms |     89 ms |
| Complete replacement flow           | 7,943 ms | 20,172 ms |

Both cases fulfilled their requested counts, delivering 12 of 12 candidates.

## Trusted-first result

Measured on 2026-08-12 after routing common topics through the versioned local candidate catalog:

| Stage                             |  p50 |   p95 |
| --------------------------------- | ---: | ----: |
| Trusted candidate suggestion      | 0 ms |  1 ms |
| Lexical enrichment and validation | 6 ms | 37 ms |
| Complete replacement flow         | 6 ms | 39 ms |

Both cases again fulfilled their requested counts, delivering 12 of 12 verified candidates with zero
rejected candidates. This demonstrates the common-topic fast path only; uncommon topics still depend
on Ollama latency, and broader catalog quality must be monitored as coverage expands.
