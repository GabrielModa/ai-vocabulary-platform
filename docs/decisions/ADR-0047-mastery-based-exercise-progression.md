# ADR-0047 — Progress exercise difficulty from demonstrated mastery

## Status

Accepted

## Context

CEFR calibrates language complexity but does not describe how well a specific learner knows a
specific sense. The existing spacing engine records retrieval success, lapses, mastery score, and
stability, while exercise publication already depends on verified content capabilities.

## Decision

Add a versioned deterministic progression policy. New knowledge begins with definition recognition,
learning knowledge advances to verified contextual cloze, and knowledge with at least four
successful retrievals and a mastery score of 0.6 advances to typed recall. An immediate lapse
returns the item to recognition. Later success clears that recovery condition through restored
stability.

Choose only among modes backed by verified capabilities. If the preferred mode is unavailable, fall
back to the strongest safe lower mode and expose the fallback reason. Do not use CEFR as a mastery
signal.

## Consequences

- Difficulty follows evidence for each learned sense.
- A wrong answer reduces scaffolding pressure instead of ending a session.
- Typed recall requires a separate publication and UI task before it can be offered.
- Versioning allows future tuning without reinterpreting historical projections.
