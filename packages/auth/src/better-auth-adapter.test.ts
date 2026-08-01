import { describe, expect, it } from "vitest";
import { BetterAuthIdentityAdapter } from "./better-auth-adapter.js";

const now = new Date("2026-01-01T00:00:00.000Z");

describe("BetterAuthIdentityAdapter", () => {
  it("denies a missing session", async () => {
    const adapter = new BetterAuthIdentityAdapter({
      api: { getSession: () => Promise.resolve(null) },
      audience: "learner",
      now: () => now,
    });
    await expect(adapter.resolve(new Headers())).resolves.toEqual({
      kind: "anonymous",
      reason: "missing",
    });
  });

  it.each([
    { user: {}, session: {} },
    { user: { id: "subject-1" }, session: { id: "session-1", expiresAt: "invalid" } },
  ])("denies an invalid provider response", async (response) => {
    const adapter = new BetterAuthIdentityAdapter({
      api: { getSession: () => Promise.resolve(response) },
      audience: "learner",
      now: () => now,
    });
    await expect(adapter.resolve(new Headers())).resolves.toEqual({
      kind: "anonymous",
      reason: "invalid",
    });
  });

  it("maps a validated, unexpired session without provider types", async () => {
    const adapter = new BetterAuthIdentityAdapter({
      api: {
        getSession: () =>
          Promise.resolve({
            user: { id: "subject-1", email: "not-exposed@example.com" },
            session: { id: "session-1", expiresAt: "2026-01-02T00:00:00.000Z" },
          }),
      },
      audience: "learner",
      now: () => now,
    });
    await expect(adapter.resolve(new Headers())).resolves.toEqual({
      kind: "authenticated",
      subjectId: "subject-1",
      sessionId: "session-1",
      audience: "learner",
      expiresAt: new Date("2026-01-02T00:00:00.000Z"),
    });
  });
});
