# ADR 099 — Interrupted study-session resume

## Status

Accepted.

## Context

The learner could lose an active exercise when reloading or closing the browser. Generation review
drafts expire on the server, while an already-created training session has stable exercise content
that can be resumed locally without regenerating lexical facts.

## Decision

Persist a bounded, versioned snapshot only after training starts. The snapshot contains sanitized
exercise content, selected terms, current position, unchecked selection, attempts, and feedback. It
expires after seven days and is never treated as mastery evidence by itself.

On the next visit the learner explicitly chooses Continue or Discard. Malformed, oversized,
unsupported, future-dated, and expired values are deleted. Completing or resetting the session also
deletes the snapshot. Storage failures are ignored so local persistence cannot block learning.

Generation review drafts are deliberately excluded because restoring an expired server reference
would create an invalid review-to-publication path.

## Consequences

- Reloads no longer destroy an active local exercise.
- Local storage remains an adapter behind validation rather than a trusted domain source.
- The resumed snapshot preserves exercise facts but does not claim a live server session identity.
- Cross-device history and mastery remain future repository-backed work.
