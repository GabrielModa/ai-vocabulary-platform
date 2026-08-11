# Task 102 — Adaptive session planner

## Goal

Build deterministic study sessions that prioritize lapses and due reviews while interleaving a
bounded amount of new material.

## Allowed files

- `packages/vocabulary/src/adaptive-session-planner.ts`
- `packages/vocabulary/src/adaptive-session-planner.test.ts`
- `packages/vocabulary/src/index.ts`
- `docs/adr/102-adaptive-session-planner.md`
- `tasks/102-adaptive-session-planner.md`

## Acceptance criteria

- Lapsed due items rank before other due items.
- Due reviews rank before early reviews; future reviews are used only to fill capacity.
- New material is capped by policy and interleaved with review material.
- Mastered future items are not selected merely to fill a session.
- Selection is deterministic, immutable, bounded, and independent of rewards.
- Empty, duplicate, invalid, and unsupported-version inputs fail explicitly.
- Unit tests cover backlog, new-item cap, interleaving, deterministic ordering, future fill,
  mastered exclusion, and invalid input.
- Documentation and all repository quality gates pass.

## Rollback

Remove the adaptive planner and export. Mastery projections and local attempt history remain valid.
