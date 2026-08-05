# Task 087 — Reviewed Study-Session Runtime Validation

## Objective

Prove that a compatible reviewed lexical set reaches a public definition-choice study session
through the real runtime contracts.

## Acceptance criteria

- The test uses the production draft resolver, publisher, persistence mapper, snapshot builder, and
  public serializer.
- Four compatible reviewed candidates publish successfully.
- The resolved draft contains no omitted candidates.
- The session contains definition-choice exercises.
- Every persisted answer exists exactly once among its four options.
- The public response exposes prompt and options without exposing the answer.
- The compatible scenario does not return `no-published-exercises`.
- Web tests, typecheck, lint, build, and formatting pass.
