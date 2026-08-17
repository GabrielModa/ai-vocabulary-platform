# Task 153 — Expand verified distractor coverage

Stop small topic-local distractor pools from rejecting otherwise usable words or repeating the same
three alternatives across a learning set.

## Allowed files

- `packages/vocabulary/src/trusted-topic-candidates.ts`
- `packages/vocabulary/src/trusted-topic-candidates.test.ts`
- `packages/vocabulary/src/definition-choice-distractor-selector.ts`
- `packages/vocabulary/src/definition-choice-distractor-selector.test.ts`
- `apps/web/app/api/vocabulary/generate/supplemental-distractor-generation.ts`
- `apps/web/app/api/vocabulary/generate/hidden-supplemental-distractor-reserve.test.ts`
- `tasks/153-expand-verified-distractor-coverage.md`

## Acceptance criteria

- Definition-choice distractors remain verified, unique, and the same part of speech as the answer.
- A matching concrete semantic role is preferred but does not reject an otherwise credible same-POS
  distractor.
- The hidden reserve can draw deterministic, level-near candidates from the complete trusted catalog
  when the selected topic is too shallow.
- The reserve is balanced across parts of speech so noun-heavy catalogs do not starve verbs and
  adjectives.
- A sufficiently deep pool rotates alternatives across the set instead of presenting a fixed trio.
- Cloze exercise rules remain unchanged.
- Repository quality gates pass.

## Product decision

For definition-to-word recognition, grammatical compatibility is a hard constraint while semantic
role is a ranking signal. Requiring every wrong answer to share the exact concrete role made small
local catalogs unusable and forced repetition. Hidden cross-topic candidates are acceptable because
they are verified lexical facts, are never shown in review, and are used only as wrong alternatives.
