# ADR-0032 — Windows launcher delegates to the canonical local runtime

## Status

Accepted.

## Context

The PowerShell launcher and `pnpm dev:local` independently started overlapping subsets of the stack.
The launcher could make the site and image worker reachable without preparing PostgreSQL, applying
migrations, or enabling the local learner identity. The UI then looked ready but lexical generation
returned an unavailable response.

Visual clues are optional for product-flow testing and must not prevent the application from
starting.

## Decision

`START-LEXI.ps1` remains the one-click Windows entry point, but delegates owned process startup to
`pnpm dev:local`. That runtime is the single owner of database readiness, migrations, Ollama,
optional image-worker startup, local authentication, and Next.js.

The launcher keeps Windows dependency and port preflight, waits for HTTP readiness, reports image
health when available, opens the browser only after readiness, and stops its owned runtime on exit.
It does not require the image venv or model, so a learner can explicitly test without images.

## Consequences

- Startup behavior cannot drift between terminal and one-click use.
- Missing visual infrastructure degrades only visual clues.
- Port 3000 must be free before launcher startup, avoiding ambiguous process ownership.
