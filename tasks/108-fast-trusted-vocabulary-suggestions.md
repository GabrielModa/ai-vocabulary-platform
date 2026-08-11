# Task 108 — Fast trusted vocabulary suggestions

## Goal

Open topic review quickly by limiting local AI to candidate suggestion and deriving learning facts
from verified local providers.

## Allowed files

- `packages/ai/src/ollama-vocabulary.ts`
- `packages/ai/src/ollama-vocabulary.test.ts`
- `apps/web/app/api/vocabulary/generate/route.ts`
- `apps/web/app/api/vocabulary/generate/lexical-enrichment.ts`
- `apps/web/app/api/vocabulary/generate/lexical-enrichment.test.ts`
- `apps/web/app/lexical-review.ts`
- `apps/web/app/lexical-review.test.ts`
- `docs/decisions/ADR-0033-fast-trusted-vocabulary-suggestions.md`
- `tasks/108-fast-trusted-vocabulary-suggestions.md`

## Acceptance criteria

- The initial Ollama response contains only exact-count candidate terms and parts of speech.
- Definitions, examples, pronunciation, frequency, and senses continue to come from verified local
  providers when available.
- Verified examples replace generated examples and provide up to three study contexts.
- Ambiguous senses are confirmed by the learner instead of selected by another AI call.
- A bounded short-lived cache makes identical requests immediate without persistence or logging.
- Output length is bounded and invalid output still fails closed with one limited retry.
- Existing review, exercise, provenance, and draft contracts remain compatible.

## Verification

- Focused provider, enrichment, and review tests.
- Repository quality gates.
- Real benchmark for ten topic candidates through the HTTP API and browser.
