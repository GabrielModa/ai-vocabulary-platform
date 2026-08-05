import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  resolveDraft: vi.fn(),
  getStudySessionRuntime: vi.fn(),
}));

vi.mock("../../../../../../src/study-session-runtime-registry", () => ({
  getStudySessionRuntime: mocks.getStudySessionRuntime,
  StudySessionRuntimeUnavailableError: class extends Error {},
}));

import { POST } from "./route";

describe("draft resolution route", () => {
  it("delegates to the runtime", async () => {
    mocks.resolveDraft.mockResolvedValueOnce(Response.json({ draftId: "resolved" }));
    mocks.getStudySessionRuntime.mockReturnValueOnce({
      resolveDraft: mocks.resolveDraft,
    });

    const response = await POST(
      new Request("http://localhost/api/vocabulary/drafts/source/resolve", {
        method: "POST",
        body: "{}",
      }),
      { params: Promise.resolve({ id: "source" }) },
    );

    expect(response.status).toBe(200);
    expect(mocks.resolveDraft).toHaveBeenCalledOnce();
  });
});
