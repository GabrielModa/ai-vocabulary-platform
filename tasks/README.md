# Initial implementation task batch

This batch contains exactly 15 reviewed tasks. Execute in numeric order unless dependencies state
otherwise. Each task is scoped to 2–6 hours and must finish with all repository quality gates green.
Do not create another batch until this one is reviewed and approved.

| Task | Title                                                 | Duration | Depends on    |
| ---- | ----------------------------------------------------- | -------- | ------------- |
| 001  | Resolve MVP product decisions                         | 3h       | None          |
| 002  | Enforce workspace boundaries                          | 4h       | 001           |
| 003  | Create validated configuration package                | 4h       | 002           |
| 004  | Create shared testing package                         | 4h       | 002           |
| 005  | Scaffold the NestJS API                               | 5h       | 003, 004      |
| 006  | Scaffold the Next.js learner web app                  | 5h       | 003, 004      |
| 007  | Scaffold the Expo mobile app                          | 6h       | 003, 004      |
| 008  | Scaffold the Next.js admin app                        | 4h       | 003, 004      |
| 009  | Establish design tokens and UI package                | 6h       | 004, 006      |
| 010  | Establish database package and migration harness      | 6h       | 003, 004, 005 |
| 011  | Establish authentication and authorization boundaries | 6h       | 005, 010      |
| 012  | Establish OpenAPI contract generation                 | 5h       | 005           |
| 013  | Add observability foundation                          | 5h       | 005           |
| 014  | Establish AI capability ports                         | 5h       | 003, 004      |
| 015  | Harden CI quality and security gates                  | 4h       | 002–014       |

“Scaffold” means runnable infrastructure with health/smoke tests only. It does not authorize product
screens, lesson logic, authentication flows, database domain schemas, or AI provider calls.

## Approved functional vertical-slice batch

Approved after completion of tasks 001–015. Execute in order and keep each task independently
reviewable.

| Task | Title                                      | Depends on |
| ---- | ------------------------------------------ | ---------- |
| 016  | Model learner-owned vocabulary collections | 010, 014   |
| 017  | Add typed-word candidate pipeline          | 016        |
| 018  | Add topic and requested-count generation   | 016, 017   |
| 019  | Add privacy-safe photo ingestion           | 016, 017   |
| 020  | Add candidate review and confirmation API  | 016–019    |
| 021  | Persist confirmed vocabulary collections   | 010, 020   |
| 022  | Build learner capture and review interface | 020, 021   |
| 023  | Generate contextual training challenges    | 014, 021   |
| 024  | Add first retrieval training session       | 021, 023   |
| 025  | Prove the end-to-end vocabulary loop       | 022–024    |
