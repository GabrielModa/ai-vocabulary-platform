# Task 042 — Content provider ports

## Goal

Define replaceable ports and strict result contracts for pronunciation, examples, images, CEFR
classification, exercise generation, and validation without importing provider SDKs.

## Allowed files

- `packages/vocabulary/src/providers.ts`
- `packages/vocabulary/src/providers.test.ts`
- `packages/vocabulary/src/index.ts`
- `docs/AI_SYSTEM.md`
- `tasks/042-content-provider-ports.md`

## Acceptance criteria

- Provider ports return untrusted output for consumer-owned validation.
- Pronunciation may omit transcription but must contain audio or a verified notation.
- Examples preserve original and adapted content separately.
- Image results distinguish licensed assets from locally generated assets through provenance.
- CEFR classifications and exercises identify the lexical sense they apply to.
- No port imports React, Ollama, OpenVINO, or an external provider SDK.

## Verification

- Focused provider-contract tests.
- Repository lint, typecheck, test, and build gates.

## Rollback

Remove the provider contract and export. No adapter depends on it yet.
