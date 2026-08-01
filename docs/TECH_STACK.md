# Technology stack

| Area             | Choice                         | Boundary                                     |
| ---------------- | ------------------------------ | -------------------------------------------- |
| Monorepo         | pnpm workspaces + Turborepo    | Reproducible affected-task orchestration     |
| Language         | TypeScript strict              | Shared language, not shared implementations  |
| Mobile           | React Native with Expo         | iOS/Android and offline client               |
| Web/admin        | Next.js                        | Responsive learner and operator experiences  |
| API              | NestJS REST + OpenAPI          | Modular monolith and generated clients       |
| Data             | PostgreSQL + Drizzle           | Durable relational state and migrations      |
| Cache/queues     | Redis                          | Ephemeral acceleration and coordination      |
| Auth             | Better Auth                    | Behind identity/application ports            |
| Storage          | Cloudflare R2                  | Scoped media object storage                  |
| AI               | OpenAI APIs initially          | Capability adapters permit replacement       |
| Payments         | Stripe                         | Entitlement adapter; no domain SDK coupling  |
| Analytics/errors | PostHog + Sentry               | Consent-aware adapters and data minimization |
| Validation       | Zod                            | Trust-boundary and contract validation       |
| Tests            | Vitest, RTL, Playwright, Detox | Layered automated assurance                  |
| Delivery         | Docker + GitHub Actions        | Immutable builds and gated promotion         |

Version upgrades are deliberate, lockfile-reviewed, tested, and recorded when compatibility or
behavior changes. A listed tool is not automatically required in the MVP.
