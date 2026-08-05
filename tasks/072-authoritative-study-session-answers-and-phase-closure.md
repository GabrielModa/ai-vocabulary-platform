# Task 072 — Authoritative study-session answers and phase closure

## Acceptance criteria

- Learners can submit an answer for an owned study session.
- Correctness is evaluated from the immutable server snapshot.
- The selected option must belong to the exercise.
- Missing ownership and missing sessions return the same result.
- Anonymous identities receive 401 and non-learners receive 403.
- The answer route is composed through the existing runtime.
- The route appears in the production build.
- The CI repository scan retains its assertions with a non-flaky timeout.
- Focused and global gates pass.
