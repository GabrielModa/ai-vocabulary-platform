# Task 071 — Draft-backed review to study-session flow

## Acceptance criteria

- The UI stores generation content, draft ID, and expiry.
- Review submits candidate IDs rather than exercise content.
- Training starts only after study-session persistence succeeds.
- The returned study-session ID is retained.
- Authentication, expiry, invalid selection, and unavailable service are handled.
- Ambiguous meanings still require explicit confirmation.
- UI tests cover generation → review → persisted session.
