# Task 049 — Sense-bound learning artifacts

## Goal

Create provider-neutral domain objects for exercises and images that are inseparably bound to the
verified candidate and selected lexical sense that produced them.

## Allowed files

- `packages/vocabulary/src/learning-artifact.ts`
- `packages/vocabulary/src/learning-artifact.test.ts`
- `packages/vocabulary/src/index.ts`
- `docs/adr/049-sense-bound-learning-artifacts.md`
- `tasks/049-sense-bound-learning-artifacts.md`

## Acceptance criteria

- Exercise and image artifacts share a stable semantic identity.
- Artifact creation requires a selected lexical sense.
- Every artifact records candidate ID, sense ID, source definition, source metadata, version,
  status, and creation time.
- Exercise creation rejects an answer missing from its options.
- Image artifacts support asynchronous job metadata without importing infrastructure code.
- Artifacts can be detected as stale when candidate ID, sense ID, or source definition changes.
- Stale and invalid transitions are immutable and retain an explicit reason.
- The domain imports no React, Next.js, provider SDK, persistence, or image-worker implementation.
- No dependency is added.
- Existing candidate-pipeline behavior remains unchanged.

## Verification

- Focused learning-artifact unit tests.
- Vocabulary package typecheck, lint, and build.
- Repository quality gates at checkpoint close.

## Rollback

Remove the new module, export, tests, ADR, and this task document.
