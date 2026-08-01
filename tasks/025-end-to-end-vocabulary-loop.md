# 025 — Prove the end-to-end vocabulary loop

## Goal

Connect and prove the MVP journey from personalized capture through learner review, persistence,
contextual retrieval, immediate feedback, and session completion.

## Requirements

- Compose existing topic generation, confirmation, persistence, challenge generation, and session
  boundaries without duplicating domain rules.
- Prove ownership, requested count, CEFR level, selected sense/context, and versioned persistence
  remain intact across the journey.
- Complete the learner web prototype through its first retrieval attempt and result state.
- Keep session performance separate from durable mastery and rewards.

## Files allowed

`packages/vocabulary/**`, `apps/web/**`, `tasks/**`, MVP documentation.

## Required tests

End-to-end happy path, invalid answer count, persisted confirmation, contextual challenge mapping,
session result, and accessible learner interface states.

## Expected commit

`feat: prove end-to-end vocabulary loop`
