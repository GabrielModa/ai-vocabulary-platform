# CI/CD

The current CI runs install with a frozen lockfile, lint, typecheck, tests, and build on pull
requests and the default branch. Permissions are read-only unless a job documents a narrower need.

## Required pull-request gates

Branch protection for `main` must require both `Reproducible quality gates` and
`Dependency, secret, and source security`, require the branch to be current, dismiss stale
approvals, and block direct pushes. Administrators should remain subject to the same rules.

`pnpm ci:all` reproduces local policy, lint, architecture boundaries, OpenAPI compatibility,
typechecking, unit/integration/contract tests, accessibility smoke tests, and builds. Database
integration tests execute migrations against isolated PGlite instances. Synthetic negative tests
prove forbidden dependencies and secret-like values fail without printing the value.

CI installs from the frozen lockfile, uses only non-production test configuration, and grants
read-only repository access by default. The security job receives only the additional
`security-events: write` permission required by CodeQL. Third-party actions are pinned to immutable
commit SHAs and annotated with their reviewed release.

Dependency Review and `pnpm audit` block high-severity dependency changes. The local policy scans
for forbidden dependencies and secret signatures; CodeQL handles source analysis. Uploaded reports
contain only commit metadata and gate status and expire after seven days.

Deploy immutable artifacts through development, preview, staging, canary, and production promotion.
Production requires protected environments, approvals, health checks, observability, and automated
rollback criteria. Secrets are environment-scoped and never injected into untrusted pull requests.

The deployment architecture milestone selects hosting and defines branch protection and release
ownership.
