# CI/CD

The current CI runs install with a frozen lockfile, lint, typecheck, tests, and build on pull
requests and the default branch. Permissions are read-only unless a job documents a narrower need.

## Planned gates

Add affected-package execution, test reports, coverage, OpenAPI compatibility, migration checks,
accessibility, dependency/secret/code/container scanning, license policy, artifact signing, and
provenance as relevant packages appear.

Deploy immutable artifacts through development, preview, staging, canary, and production promotion.
Production requires protected environments, approvals, health checks, observability, and automated
rollback criteria. Secrets are environment-scoped and never injected into untrusted pull requests.

The deployment architecture milestone selects hosting and defines branch protection and release
ownership.
