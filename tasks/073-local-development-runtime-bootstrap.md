# Task 073 — Local development runtime bootstrap

## Acceptance criteria

- `.env.local` is loaded before configuration is resolved.
- The configured Ollama model must be installed.
- Next.js registers runtime adapters during development startup.
- Local identity requires an explicit flag and learner ID.
- Production cannot enable the local identity.
- Manual generation no longer returns `GENERATION_RUNTIME_UNAVAILABLE`.
