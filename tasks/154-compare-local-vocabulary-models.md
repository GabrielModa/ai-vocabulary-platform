# Task 154 — Compare local vocabulary models

## Status

Approved

## Goal

Compare local Ollama models through the real lexical enrichment and deficit-replacement pipeline
without allowing the trusted-topic fast path to hide model behavior.

## Acceptance criteria

- A deterministic `--model-comparison` matrix uses topics outside the trusted catalog.
- Model-comparison mode calls Ollama directly while all other benchmark modes retain trusted-first
  production routing.
- Output identifies the tested model and mode without logging generated vocabulary.
- The same cases run for every compared model.
- Results report fulfillment, rejection, attempts, and stage latency.
- Structured candidate generation disables model thinking so the token budget is spent on the
  schema-bound answer.
- A local comparison documents hardware, model versions, results, and the adoption decision.
- Repository quality gates pass.

## Allowed files

- `apps/web/scripts/run-vocabulary-benchmark.ts`
- `apps/web/src/vocabulary-benchmark-cases.ts`
- `apps/web/src/vocabulary-benchmark-cases.test.ts`
- `packages/ai/src/ollama-vocabulary.ts`
- `packages/ai/src/ollama-vocabulary.test.ts`
- `docs/performance/local-model-comparison.md`
- `tasks/154-compare-local-vocabulary-models.md`

## Product decision

Model promotion requires evidence from the application pipeline. Generic model leaderboards cannot
replace lexical coverage, schema reliability, fulfillment, and latency measured on target hardware.
