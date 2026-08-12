# Expanded topic coverage benchmark

## Method

Run `pnpm benchmark:vocabulary -- --coverage` from the repository root. The matrix exercises the
same trusted-first suggestion, lexical enrichment, deterministic validation, and deficit replacement
path as the web route. It requests six verified items for each of these cases:

- family at A2;
- shopping at B1;
- home at B1;
- environment at B2;
- money at C1.

The output contains aggregate counts and durations only. It does not log generated vocabulary or
learner input. Ollama remains connected as a fallback and is only used if trusted candidates cannot
fill a deficit.

## Result

Measured on the Windows development machine on 2026-08-12:

| Measure                        |    Result |
| ------------------------------ | --------: |
| Cases                          |         5 |
| Requested / delivered          |   30 / 30 |
| Exact fulfillment              |      100% |
| Rejected candidates            |         0 |
| Total attempts                 |         5 |
| Candidate suggestion p50 / p95 |  0 / 3 ms |
| Lexical enrichment p50 / p95   | 5 / 34 ms |
| Complete replacement p50 / p95 | 5 / 37 ms |

Every case completed in one attempt, so the Ollama deficit fallback was not needed. These results
prove the selected theme/level pairs only. Unsupported topics and deeper requests can still require
the slower generative fallback and must retain honest partial-result handling.
