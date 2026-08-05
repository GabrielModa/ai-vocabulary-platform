# Task 089 — MVP End-to-End HTTP Validation

## Objective

Validate the complete authenticated learner workflow across the production HTTP handlers.

## Acceptance criteria

- Review resolution uses a trusted server-side generation draft.
- Four compatible reviewed candidates publish without `no-published-exercises`.
- Session creation consumes the resolved draft and returns HTTP 201.
- Public create and retrieve responses do not expose answers.
- The session contains four definition-choice exercises.
- Answer submission uses the immutable snapshot.
- A correct persisted option returns `correct: true`.
- No external AI, network, browser, or database dependency is required.
- Focused tests, web typecheck, lint, build, and formatting pass.
