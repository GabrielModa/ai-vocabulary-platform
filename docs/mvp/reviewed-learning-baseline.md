# Reviewed Learning MVP Baseline

## Status

Core reviewed-learning contracts frozen at Task 090. The learner-facing no-image journey is
completed through Task 146.

## Product contract

The MVP turns AI-proposed English vocabulary into trusted, reproducible learning sessions.

```text
request
→ local AI candidates
→ lexical evidence
→ contextual sense resolution
→ reviewed publication
→ persistent exercise
→ immutable study-session snapshot
→ public exercise projection
→ authoritative answer evaluation
```

AI output is never the final learning truth. Lexical evidence, domain validation, review decisions,
and persisted exercise contracts remain authoritative.

## Supported exercise kinds

### Verified cloze

Published only when the selected lexical sense and example evidence support a valid cloze exercise.

### Definition choice

Published from resolved `WordKnowledge` when a compatible pool can provide one target and three
deterministic distractors.

The reviewed strategy layer prefers verified cloze and falls back to definition choice.

## Frozen invariants

1. A selected sense must exist in trusted lexical evidence.
2. Review resolution cannot invent candidate IDs or sense IDs.
3. Exercise publication must produce a persistent discriminated union.
4. Study sessions are created only from trusted server-side drafts.
5. Session snapshots are immutable and learner-owned.
6. Public session responses never expose persisted answers.
7. Submitted options must exist in the immutable exercise.
8. Correctness is evaluated against the persisted answer.
9. Compatible reviewed definition-choice pools must not fail with `no-published-exercises`.
10. The complete authenticated learner flow must remain deterministic without external AI or network
    services in tests.

## Release gate

Run:

```bash
pnpm mvp:verify
```

The gate covers:

- contextual strategy orchestration;
- reviewed publication;
- persistent draft resolution;
- study-session runtime projection;
- HTTP review resolution;
- session creation and retrieval;
- answer submission;
- TypeScript;
- ESLint;
- Next.js production build;
- repository formatting.

## Learner-facing no-image journey

The local MVP supports a complete learning loop without waiting for generated images:

1. Create a focused set from words or a topic; ten words is the pedagogical default.
2. Review, select, study, and resolve genuinely ambiguous meanings before publication.
3. Practise verified cloze, definition-choice, and adaptive typed-recall exercises.
4. Receive immediate verified feedback, navigate the set, and inspect the final report.
5. Preserve interrupted sessions and completed attempts locally.
6. Prioritize due adaptive review on the next visit.

Generation communicates time-based stages without claiming fabricated provider progress. Lexical
readiness is explained in learner-facing language; diagnostic scores remain available through
optional details.

## Extension rules

New lexical providers must map evidence into existing domain contracts rather than bypass
validation.

New exercise kinds must:

1. declare their evidence capabilities;
2. publish through a typed strategy;
3. map into the persistent exercise union;
4. map into the immutable snapshot union;
5. extend the centralized study-session runtime;
6. preserve answer-free public responses;
7. add focused and end-to-end tests.

Changes to frozen invariants require a new ADR and an updated MVP release gate.

## Next product phase

After browser acceptance of the local release, the next phase should build product differentiation
on this baseline:

- official CEFR calibration and frequency ranking;
- richer lexical-source aggregation;
- learner performance history;
- spaced repetition and scheduling;
- exercise-quality metrics;
- additional evidence-backed exercise strategies;
- production observability and deployment hardening.
