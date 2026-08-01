# Learning engine

## Responsibility

The learning engine selects the next useful activity and converts learner attempts into mastery
evidence. It does not award XP, manage subscriptions, or generate unvalidated content.

## Mastery dimensions

- Meaning recognition and unhinted recall
- Spelling and written production
- Listening discrimination and comprehension
- Pronunciation and spoken production
- Sense selection and natural use across contexts

Each attempt records content version, activity type, direction, modality, context novelty, response,
latency, hints, feedback, outcome, device time, server time, and algorithm version. Sensitive raw
media follows separate retention policy.

## Selection policy

Balance due reviews, weak mastery dimensions, new material, context variety, session length, fatigue
signals, content prerequisites, and offline availability. Avoid repeated guessing patterns and
excessive consecutive failures.

## Evidence rules

Unhinted generation is stronger than recognition; success after a hint is useful but weaker;
repeated exposure without retrieval is not evidence of recall. Mastery estimates express uncertainty
and may decrease after failed retrieval.

## Evaluation

Algorithms are deterministic for fixed inputs, versioned, replayable against immutable events, and
tested with curated learner histories. Changes use staged rollout and compare retention guardrails.
