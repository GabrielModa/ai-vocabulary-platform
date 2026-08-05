import type { BetterAuthSessionApi } from "@vocabulary/auth/better-auth";
import { afterEach, describe, expect, it } from "vitest";
import { configureBetterAuthRuntime } from "./better-auth-runtime-bootstrap";
import {
  getStudySessionRuntime,
  resetStudySessionRuntimeForTests,
} from "./study-session-runtime-registry";

const originalDatabaseUrl = process.env.DATABASE_URL;

afterEach(async () => {
  await resetStudySessionRuntimeForTests();
  if (originalDatabaseUrl === undefined) {
    delete process.env.DATABASE_URL;
  } else {
    process.env.DATABASE_URL = originalDatabaseUrl;
  }
});

describe("Better Auth runtime bootstrap", () => {
  it("registers learner identity resolution", async () => {
    process.env.DATABASE_URL = "postgres://postgres:postgres@localhost:5432/vocabulary";
    const api: BetterAuthSessionApi = {
      getSession() {
        return Promise.resolve({
          user: { id: "learner-1" },
          session: {
            id: "session-1",
            expiresAt: "2027-01-01T00:00:00.000Z",
          },
        });
      },
    };

    configureBetterAuthRuntime({
      api,
      now: () => new Date("2026-08-05T00:00:00.000Z"),
    });

    await expect(getStudySessionRuntime().identity.resolve(new Headers())).resolves.toMatchObject({
      kind: "authenticated",
      subjectId: "learner-1",
      audience: "learner",
    });
  });
});
