import { describe, expect, it, vi } from "vitest";

const runtimeMocks = vi.hoisted(() => ({
  answers: vi.fn(),
  getStudySessionRuntime: vi.fn(),
}));

vi.mock("../../../../../src/study-session-runtime-registry", () => ({
  getStudySessionRuntime: runtimeMocks.getStudySessionRuntime,
  StudySessionRuntimeUnavailableError: class extends Error {},
}));

import { POST } from "./route";

describe("study-session answer route", () => {
  it("delegates to the composed runtime", async () => {
    runtimeMocks.answers.mockResolvedValueOnce(
      Response.json({
        sessionId: "session-1",
        exerciseId: "exercise-1",
        selectedOption: "sample",
        correct: true,
        correctAnswer: "sample",
      }),
    );
    runtimeMocks.getStudySessionRuntime.mockReturnValueOnce({
      answers: runtimeMocks.answers,
    });

    const response = await POST(
      new Request("http://localhost/api/study-sessions/session-1/answers", {
        method: "POST",
        body: "{}",
      }),
      { params: Promise.resolve({ id: "session-1" }) },
    );

    expect(response.status).toBe(200);
    expect(runtimeMocks.answers).toHaveBeenCalledOnce();
  });
});
