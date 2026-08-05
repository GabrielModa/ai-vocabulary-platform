# ADR-083 — Definition Choice Publishing

## Status

Accepted.

## Context

Tasks 080–082 introduced capability planning, deterministic distractor selection, and
definition-choice composition. These pieces still require an orchestration boundary that produces
one stable result suitable for persistence or session integration.

## Decision

Introduce `publishDefinitionChoice`.

The publisher:

1. derives capabilities from the target `WordKnowledge`;
2. selects three compatible distractors from the supplied knowledge pool;
3. composes a definition-choice exercise;
4. returns an immutable published result with stable publication and exercise IDs.

Failures remain structured and do not partially publish content.

This task establishes the domain publishing boundary only. HTTP, database, draft, and study-session
integration remain outside the domain and will consume this result in Task 084.

## Consequences

The application can request one complete definition-choice publication without coordinating three
domain services itself. The next integration can map this stable publication contract into the
existing persistent exercise/session model.
