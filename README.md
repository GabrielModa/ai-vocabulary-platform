# AI Vocabulary Platform

An AI-powered English vocabulary learning platform designed around contextual learning, active
recall, adaptive difficulty, and spaced repetition.

> The repository is currently in its foundation phase. It contains infrastructure and planning only;
> application features have not been implemented.

## Prerequisites

- Node.js 22 or later
- pnpm 11 or later
- Docker with Docker Compose for local infrastructure

## Setup

```bash
cp .env.example .env
pnpm install
docker compose up -d
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Do not put real credentials in `.env.example` or commit a local `.env` file.

## Workspace layout

- `apps/`: deployable mobile, web, API, and administration applications
- `packages/`: reusable domain, infrastructure, UI, configuration, and testing packages
- `docs/`: product, architecture, operations, and engineering documentation
- `tasks/`: reviewed implementation tasks small enough for one developer-day
- `docker/`: local and deployment container assets
- `scripts/`: repository automation
- `tests/`: cross-application and system-level tests

## Commands

| Command          | Purpose                               |
| ---------------- | ------------------------------------- |
| `pnpm lint`      | Check ESLint and formatting           |
| `pnpm typecheck` | Check TypeScript across the workspace |
| `pnpm test`      | Run automated tests                   |
| `pnpm build`     | Build affected workspace projects     |
| `pnpm format`    | Apply repository formatting           |

## Contribution and security

Read [CONTRIBUTING.md](CONTRIBUTING.md) before opening changes. Report vulnerabilities according to
[SECURITY.md](SECURITY.md), never in a public issue.

## License

Licensed under the [MIT License](LICENSE).
