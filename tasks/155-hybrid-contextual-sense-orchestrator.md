# Task 155 — Hybrid contextual sense orchestrator

## Status

Approved

## Goal

Resolve obvious lexical ambiguity by combining verified senses, deterministic context evidence, and
a schema-bound AI fallback instead of asking the learner to confirm every multi-sense word.

## Acceptance criteria

- Deterministic selection receives the real topic and CEFR level.
- An AI decision at confidence 0.95 or higher may select only an official supplied sense ID.
- Low-confidence, malformed, unavailable, or invented selections remain reviewable.
- AI-selected definitions and examples retain their original lexical provenance.
- The Ollama selector uses a strict schema, deterministic sampling, disabled thinking, and no
  authority to create lexical facts.
- Single-sense and deterministic paths do not call AI.
- Repository quality gates pass.

## Allowed files

- `packages/vocabulary/src/contextual-candidate-resolution.ts`
- `packages/vocabulary/src/contextual-candidate-resolution.test.ts`
- `packages/vocabulary/src/contextual-sense-selector.ts`
- `packages/vocabulary/src/contextual-sense-selector.test.ts`
- `apps/web/app/api/vocabulary/generate/lexical-enrichment.ts`
- `apps/web/app/api/vocabulary/generate/lexical-enrichment.test.ts`
- `apps/web/app/api/vocabulary/generate/contextual-lexical-enrichment.test.ts`
- `apps/web/src/ollama-contextual-sense-selector.ts`
- `apps/web/src/ollama-contextual-sense-selector.test.ts`
- `docs/decisions/ADR-0052-hybrid-contextual-sense-orchestrator.md`
- `tasks/155-hybrid-contextual-sense-orchestrator.md`

## Product decision

Verified lexical providers remain authoritative for senses and definitions. Deterministic evidence
gets first refusal; AI is a constrained ranker over allowed IDs, and learner confirmation remains
the fallback for genuine uncertainty.
