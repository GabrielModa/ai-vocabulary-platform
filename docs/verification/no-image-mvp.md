# No-image MVP verification

## Supported startup

Windows users can double-click `START-LEXI-NO-IMAGES.cmd` to start PostgreSQL readiness checks,
migrations, Ollama, and the Next.js application without starting or waiting for the optional image
worker. The regular `START-LEXI.cmd` continues to start the complete runtime.

From a terminal, the equivalent command is:

```powershell
pnpm dev:local:no-images
```

The no-image option changes image-worker startup only. It does not bypass lexical verification,
exercise validation, local learner identity, persistence, or database migrations.

## Verification evidence

Verified on the Windows development machine on 2026-08-12:

- option parser: 3 tests passed, including default, explicit no-image mode, and unknown flags;
- PowerShell launcher syntax parsed without errors;
- focused `pnpm mvp:verify` passed after one formatting-only rerun;
- `pnpm test:accessibility` passed;
- the app returned HTTP 200 at `http://localhost:3000` with the image worker absent;
- the live browser exposed the visual-clue checkbox and retained its disabled state for submission;
- an old standalone Next.js process was correctly diagnosed by `GENERATION_RUNTIME_UNAVAILABLE` and
  replaced with the canonical local runtime;
- the canonical no-image runtime returned HTTP 200 for a B1 family request with 6 of 6 candidates,
  exact fulfillment, and one attempt;
- the expanded topic benchmark separately delivered 30 of 30 verified candidates with zero
  rejections.

The browser-control surface refused a reload after the local server process changed because of its
URL security policy. No workaround was attempted. The post-generation review, training, feedback,
history, and adaptive-review interactions remain covered by the focused MVP test suite and page
interaction tests.

## Known scope

This is the shippable local MVP without images. Image generation, visual-clue pedagogy, and worker
GPU performance remain optional follow-up work and do not block text/audio vocabulary practice.
PostgreSQL and the configured Ollama model are still required by the canonical runtime, including
for unsupported topics that need generative deficit fallback.
