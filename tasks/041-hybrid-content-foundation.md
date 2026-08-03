# Task 041 — Hybrid content foundation

## Goal

Create the provider-neutral contract that separates verified lexical facts from generated or adapted
content before expanding the learning interface.

## Allowed files

- `packages/vocabulary/src/content.ts`
- `packages/vocabulary/src/content.test.ts`
- `packages/vocabulary/src/index.ts`
- `docs/ROADMAP.md`
- `tasks/041-hybrid-content-foundation.md`

## Acceptance criteria

- Every content record carries explicit provenance and validation status.
- Generated content cannot claim verified status.
- Unknown facts remain absent instead of being synthesized as empty or placeholder values.
- Lexical records identify a normalized word, sense, word class, and optional CEFR and definition.
- Contracts remain independent of React, Ollama, OpenVINO, and future external provider SDKs.

## Verification

- Focused vocabulary-domain tests.
- Repository lint, typecheck, test, and build gates.

## Rollback

Remove the new contract and export. No runtime path consumes it yet.
