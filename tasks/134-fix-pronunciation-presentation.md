# Task 134 — Fix pronunciation presentation

## Goal

Remove corrupted speaker glyphs and present available verified CMUdict pronunciation evidence
without implying that browser speech synthesis is official recorded audio.

## Allowed files

- `tasks/134-fix-pronunciation-presentation.md`
- `apps/web/app/capture-workspace.tsx`
- `apps/web/app/lexical-review.ts`
- `apps/web/src/pronunciation-presentation.test.ts`
- `docs/decisions/0022-pronunciation-presentation.md`

## Acceptance criteria

- No mojibake speaker text remains in the learner workspace.
- Speaker controls use one encoding-independent, decorative SVG icon.
- Existing accessible names remain on every audio button.
- Study mode shows verified US ARPABET only when CMUdict evidence exists.
- The UI does not call browser speech synthesis official audio and does not convert ARPABET to
  invented IPA or Portuguese respelling.
- The decision and limitations are documented.

## Verification

- Directed Vitest presentation test.
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`
