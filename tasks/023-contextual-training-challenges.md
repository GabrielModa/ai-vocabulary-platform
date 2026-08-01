# 023 — Generate contextual training challenges

## Goal

Generate validated contextual retrieval challenges from approved candidates in a confirmed
collection.

## Requirements

- Use only approved candidates and preserve their selected sense and source context.
- Generate recall, cloze, and contextual-choice challenges behind a provider-neutral port.
- Require one challenge per approved candidate, stable candidate references, and safe errors.

## Files allowed

`packages/vocabulary/**`, `tasks/**`, training architecture documentation.

## Expected commit

`feat(vocabulary): generate contextual training challenges`
