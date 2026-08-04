import { afterEach, describe, expect, it } from "vitest";
import { resetStudySessionRuntimeForTests } from "../../../../src/study-session-runtime-registry";
import { GET } from "./route";

afterEach(async () => {
  await resetStudySessionRuntimeForTests();
});

describe("study-session item route", () => {
  it("returns a safe 503 while runtime bootstrap is absent", async () => {
    const response = await GET(new Request("http://localhost/api/study-sessions/missing"), {
      params: Promise.resolve({ id: "missing" }),
    });

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      code: "STUDY_SESSION_RUNTIME_UNAVAILABLE",
      message: "Study sessions are temporarily unavailable",
    });
  });
});
