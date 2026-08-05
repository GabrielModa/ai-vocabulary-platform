import type { SessionIdentityPort } from "@vocabulary/auth";
import { describe, expect, it, vi } from "vitest";
import type { PersistentStudySessionDrafts } from "../../../../src/study-session-drafts";
import { createDraftResolutionHandler } from "./resolve-http";

const identity: SessionIdentityPort<Headers> = {
  resolve() {
    return Promise.resolve({
      kind: "authenticated",
      subjectId: "learner-1",
      sessionId: "auth-1",
      audience: "learner",
      expiresAt: new Date("2027-01-01T00:00:00.000Z"),
    });
  },
};

describe("draft resolution HTTP", () => {
  it("creates a resolved draft", async () => {
    const resolveReview = vi.fn(() =>
      Promise.resolve({
        ok: true as const,
        expiresAt: "2026-08-06T00:30:00.000Z",
        publishedCandidateIds: ["candidate:corner:noun"],
        omittedCandidateIds: [],
      }),
    );
    const handler = createDraftResolutionHandler({
      identity,
      drafts: { resolveReview } as unknown as PersistentStudySessionDrafts,
      now: () => new Date("2026-08-06T00:00:00.000Z"),
      createDraftId: () => "resolved-draft-1",
    });

    const response = await handler(
      new Request("http://localhost/api/vocabulary/drafts/source/resolve", {
        method: "POST",
        body: JSON.stringify({
          selections: [
            {
              candidateId: "candidate:corner:noun",
              senseId: "sense-football-corner",
            },
          ],
        }),
      }),
      { params: Promise.resolve({ id: "source-draft-1" }) },
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      draftId: "resolved-draft-1",
    });
    expect(resolveReview).toHaveBeenCalledOnce();
  });

  it("rejects malformed selections", async () => {
    const handler = createDraftResolutionHandler({
      identity,
      drafts: {} as PersistentStudySessionDrafts,
    });
    const response = await handler(
      new Request("http://localhost/api/vocabulary/drafts/source/resolve", {
        method: "POST",
        body: JSON.stringify({ selections: [] }),
      }),
      { params: Promise.resolve({ id: "source" }) },
    );
    expect(response.status).toBe(400);
  });
});
