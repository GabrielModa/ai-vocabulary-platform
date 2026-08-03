# Task 048 — Verified candidate pipeline

## Goal

Treat local-AI vocabulary output as candidate suggestions, normalize and deduplicate those
suggestions, and attach verified lexical facts before the web application treats them as learning
candidates.

## Allowed files

- `packages/vocabulary/src/candidate-pipeline.ts`
- `packages/vocabulary/src/candidate-pipeline.test.ts`
- `packages/vocabulary/src/index.ts`
- `apps/web/app/api/vocabulary/generate/lexical-enrichment.ts`
- `apps/web/app/api/vocabulary/generate/lexical-enrichment.test.ts`
- `tasks/048-verified-candidate-pipeline.md`

## Acceptance criteria

- Suggested terms are normalized before lookup and deduplicated by lemma and proposed word class.
- Every accepted item has a stable candidate ID, lexical status, available senses, and selection
  reasons.
- Exactly one compatible defined sense becomes an atomic selected sense with provenance.
- Multiple compatible senses remain ambiguous and never select the first result by position.
- Missing or invalid provider results remain unavailable without inventing verified facts.
- Rejected duplicate suggestions are observable in the pipeline result.
- The web endpoint preserves the existing candidate response while exposing candidate strategy and
  rejections.
- No provider SDK, React, Next.js, persistence, corpus, or new dependency enters the domain
  pipeline.

## Verification

- Focused candidate-pipeline unit tests.
- Focused server lexical-enrichment tests.
- Vocabulary package typecheck and build.
- Web typecheck and build.
- Repository quality gates at checkpoint close.

## Rollback

Remove the candidate-pipeline module and restore direct per-candidate enrichment in the web
endpoint.
