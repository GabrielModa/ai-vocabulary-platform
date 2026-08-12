# No-image MVP release verification — 2026-08-12

## Result

Release candidate accepted for the no-image MVP.

## Automated evidence

- `pnpm mvp:verify`: passed.
- `pnpm lint`: passed.
- `pnpm typecheck`: passed.
- `pnpm test`: passed.
- `pnpm build`: passed.
- Focused web TypeScript and ESLint after actionable-publication feedback: passed.
- `git diff --check`: passed.

## Operational evidence

`pnpm dev:local:no-images` confirmed:

- PostgreSQL available at `localhost:5432`;
- Ollama available at `localhost:11434` with `qwen2.5:3b`;
- image worker disabled without blocking startup;
- database package built;
- migrations applied successfully;
- Next.js returned HTTP 200 at `http://localhost:3000`.

The launcher also refused a duplicate Next.js instance when port 3000 was already occupied, leaving
the existing application available.

## Included learner journey

- trusted-first/local candidate generation;
- lexical evidence and contextual sense resolution;
- provisional generated-example quality screen;
- honest set readiness (`ready`, `partial`, `blocked`);
- Study/Test review modes;
- authoritative final exercise publication;
- actionable omitted-word feedback;
- immutable study session;
- answer evaluation and immediate feedback;
- report, wrong-word practice, local history, mastery, and adaptive review;
- optional images disabled without degrading the text/audio learning flow.

## Known post-MVP work

- stronger CEFR evidence beyond local heuristics;
- licensed sense-bound example corpus;
- delayed-retention analytics at 1, 7, and 30 days;
- mastery explicitly audited by lexical sense and exercise capability;
- productive sentence generation and transfer exercises;
- optional visual-clue quality improvements.

These items improve learning depth but do not block the current no-image MVP journey.

## Manual product smoke test

1. Open `http://localhost:3000`.
2. Disable visual clues.
3. Generate four A2 football words.
4. Review in Test mode and confirm meanings remain hidden.
5. Start training and answer all questions.
6. Navigate backward and forward once.
7. Finish and open the report.
8. Practice only incorrect words.
9. Return to the home screen and confirm history/progress.
