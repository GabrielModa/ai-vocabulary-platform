# ADR-087 — Reviewed Study-Session Runtime Validation

## Status

Accepted.

## Context

Tasks 083–086 introduced definition-choice publication, persistence mapping, draft-resolution
fallback, public serialization, and strategy orchestration. Those components passed focused tests,
but no single test proved that trusted review data can traverse the complete runtime boundary.

The highest-risk regression is a reviewed set producing valid definition-choice publications but
failing later with `no-published-exercises`, an invalid resolved draft, an incompatible session
snapshot, or a public response that leaks the answer.

## Decision

Add an integration-level runtime contract test using an in-memory `GenerationDraftRepository`.

The test exercises the real production components in sequence:

1. load a trusted generation draft with four reviewed lexical candidates;
2. call `resolveReview`;
3. persist and resolve the reviewed draft;
4. build a study-session snapshot;
5. serialize the public study-session response.

The test also verifies that:

- every selected candidate publishes through the definition-choice fallback;
- the session snapshot retains one correct answer among four options;
- the public response exposes prompts and options but not answers;
- the flow no longer returns `no-published-exercises` for a compatible reviewed pool.

No new production abstraction is introduced. The current runtime components already form the desired
pipeline; this task freezes their end-to-end contract before further cleanup.

## Consequences

Future changes to generation drafts, review resolution, strategy selection, persistent exercise
unions, session snapshots, or response serialization must preserve the complete reviewed flow.
