import { afterEach, describe, expect, it } from "vitest";
import { resetStudySessionRuntimeForTests } from "../../../src/study-session-runtime-registry";
import { POST } from "./route";

afterEach(async () => {
  await resetStudySessionRuntimeForTests();
});

describe("study-session collection route", () => {
  it("returns a safe 503 while runtime bootstrap is absent", async () => {
    const response = await POST(
      new Request("http://localhost/api/study-sessions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "{}",
      }),
    );

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      code: "STUDY_SESSION_RUNTIME_UNAVAILABLE",
      message: "Study sessions are temporarily unavailable",
    });
  });
});
