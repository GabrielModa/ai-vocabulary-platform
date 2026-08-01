# 016 — Model learner-owned vocabulary collections

## Goal

Define the domain rules shared by text, photo, and topic-created vocabulary collections.

## Requirements

- Model learner ownership, CEFR A2–C2, source type, source context, selected sense, and editable
  candidates.
- Keep generated/extracted candidates proposed until the learner confirms a selection.
- Allow separate senses of the same English term while rejecting exact term/sense duplicates.
- Preserve topic requested count and photo media reference without storing media bytes.

## Acceptance criteria

- Text, topic, and photo drafts validate through one provider-neutral domain package.
- Draft collections cannot train; confirmed collections with selected candidates can train.
- Invalid levels, counts, duplicate candidates, or cross-collection candidate IDs are rejected with
  safe domain errors.

## Files allowed

`packages/vocabulary/**`, `tasks/**`, workspace lockfile, vocabulary architecture documentation.

## Files forbidden

Provider adapters, prompts, API endpoints, persistence schemas, learner screens, training logic.

## Required tests

Source variants, CEFR/count validation, edit, duplicate senses, confirmation, ownership-safe errors.

## Expected commit

`feat(vocabulary): model learner-owned collections`
