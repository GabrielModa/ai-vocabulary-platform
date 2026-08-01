# 018 — Add topic and requested-count generation

## Goal

Turn a learner-provided topic and requested word count into a balanced, validated, editable
vocabulary collection at the selected CEFR level.

## Requirements

- Accept a trimmed topic of 2–200 characters and an integer count of 1–100.
- Isolate topic generation behind a provider-neutral port.
- Require exactly the requested number of unique English term/sense candidates.
- Require useful coverage across nouns, verbs, adjectives, collocations, phrasal verbs, and
  expressions, proportional to the requested count.
- Preserve the topic, requested count, level, and generation context.
- Create only proposed candidates in a draft collection.

## Acceptance criteria

- The generator receives the normalized topic, exact requested count, level, and required
  categories.
- Invalid, short, extra, duplicate, or unbalanced generator output is rejected before collection
  creation.
- No candidate is automatically confirmed and errors contain no learner-entered topic.

## Files allowed

`packages/vocabulary/**`, `tasks/**`, workspace lockfile, vocabulary architecture documentation.

## Files forbidden

Network/provider adapters, prompts, persistence, API routes, photo flows, learner screens, and
training activities.

## Required tests

Input boundaries, request propagation, exact count, category balance, duplicate rejection, output
validation, determinism, safe errors, and draft-only status.

## Expected commit

`feat(vocabulary): add topic collection generation`
