# Task 046 — Pedagogical visual composition

## Goal

Make local visual clues prefer a simple, concept-centered educational drawing over a generic or
photographic scene while remaining safe and avoiding literal answer disclosure.

## Allowed files

- `packages/ai/src/safe-vocabulary-image.ts`
- `packages/ai/src/safe-vocabulary-image.test.ts`
- `services/image-worker/image_worker/domain.py`
- `services/image-worker/tests/test_domain.py`
- `docs/AI_SYSTEM.md`
- `tasks/046-pedagogical-visual-composition.md`

## Acceptance criteria

- The application and worker use the same controlled visual-composition policy.
- Prompts request a single uncluttered educational drawing with one central observable subject or
  action and strong visual hierarchy.
- Prompts explicitly reject photographic composition, collages, decorative scenes, and written
  answers.
- Relational or abstract concepts are treated as supporting context rather than promised as an
  unambiguous visual answer.
- Existing request validation, deterministic moderation, quarantine, and safety checking remain
  unchanged.

## Verification

- Python prompt-contract tests.
- TypeScript prompt-contract tests where the environment permits Vitest startup.
- Worker test suite, typecheck, lint, and build.

## Rollback

Restore the previous controlled prompt copy; no cache or storage migration is required because the
prompt is already part of each request's deterministic job identity inputs.
