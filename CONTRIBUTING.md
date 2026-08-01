# Contributing

## Workflow

1. Start from an approved task in `tasks/`.
2. Create a short-lived branch using `type/short-description`.
3. Write tests before implementation when application development begins.
4. Keep changes within the task's allowed files.
5. Run all quality gates.
6. Use a Conventional Commit and open a pull request.

## Quality gates

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

All commands must pass before a commit is considered complete. Do not bypass hooks to merge broken
or unreviewed work.

## Commit format

Use `type(scope): description` when a scope adds clarity. Allowed types include `build`, `chore`,
`ci`, `docs`, `feat`, `fix`, `perf`, `refactor`, `style`, and `test`.

## Pull requests

- Explain what changed and why.
- Link the approved task and architectural decision where applicable.
- Include test evidence and migration or rollback notes.
- Keep the pull request focused; split unrelated changes.
