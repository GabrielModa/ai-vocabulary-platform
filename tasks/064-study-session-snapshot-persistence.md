# Task 064 — Study-session snapshot persistence

## Goal

Persist and retrieve immutable study-session snapshots idempotently.

## Acceptance criteria

- A generated Drizzle migration creates the product table.
- Session ID is the primary key.
- Version, title, level, timestamp, ordered exercise IDs, and full snapshot are stored.
- Saving a new snapshot returns `created: true`.
- Saving the same snapshot again returns `created: false`.
- Reusing an ID with different content returns a typed conflict.
- Existing data is never overwritten on conflict.
- Loading an unknown ID returns undefined.
- Loaded snapshots and nested collections are frozen.
- Test database reset removes saved sessions.
- Independent databases remain isolated.
- No clock, randomness, network, AI, or web response type is used.

## Next checkpoint

Add authenticated application/API operations to create and retrieve study sessions.
