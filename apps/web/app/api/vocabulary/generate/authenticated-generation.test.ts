import type { SessionIdentityPort } from "@vocabulary/auth";
import type { EnrichedVocabularySet } from "./lexical-enrichment";
import { describe, expect, it, vi } from "vitest";
import type {
  PersistentStudySessionDrafts,
  SaveTrustedGenerationDraftInput,
} from "../../../../src/study-session-drafts";
import { createAuthenticatedVocabularyGenerationHandler } from "./authenticated-generation";

const generated: EnrichedVocabularySet = {
  title: "Food vocabulary",
  candidateStrategy: "suggest-verify-select",
  rankingStrategy: "deterministic-weighted-ranking",
  rejectedCandidates: [],
  candidates: [
    {
      term: "sample",
      meaning: "try a small amount",
      type: "verb",
      example: "Students sample regional dishes.",
      challenge: "Students ___ regional dishes.",
      candidateId: "candidate:sample",
      normalizedLemma: "sample",
      selectionReasons: [],
      lexicalValidationStatus: "verified",
      rank: 1,
      rankingScore: 1,
      rankingContributions: [],
      exercisePipelineOutcome: {
        outcome: "reject",
        pipeline: "verified-exercise-pipeline-v1",
        semanticUniqueness: "not-proven",
        stage: "structural-policy",
        structuralReasons: ["invalid-gap-count"],
      },
    },
  ],
};

function identity(
  value:
    | { readonly kind: "anonymous"; readonly reason: "missing" }
    | {
        readonly kind: "authenticated";
        readonly subjectId: string;
        readonly sessionId: string;
        readonly audience: "learner" | "operator";
        readonly expiresAt: Date;
      },
): SessionIdentityPort<Headers> {
  return {
    resolve() {
      return Promise.resolve(value);
    },
  };
}

function request(): Request {
  return new Request("http://localhost/api/vocabulary/generate", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      topic: "food",
      requestedCount: 1,
      level: "B1",
    }),
  });
}

describe("authenticated vocabulary generation", () => {
  it("requires a learner before generation", async () => {
    const generate = vi.fn();
    const save = vi.fn();
    const handler = createAuthenticatedVocabularyGenerationHandler({
      identity: identity({
        kind: "anonymous",
        reason: "missing",
      }),
      drafts: { save },
      generate,
    });

    const response = await handler(request());

    expect(response.status).toBe(401);
    expect(generate).not.toHaveBeenCalled();
    expect(save).not.toHaveBeenCalled();
  });

  it("persists a trusted learner draft", async () => {
    let saved: SaveTrustedGenerationDraftInput | undefined;
    const drafts: PersistentStudySessionDrafts = {
      save(input) {
        saved = input;
        return Promise.resolve({ created: true });
      },
      resolve: vi.fn(),
      resolveReview: vi.fn(),
    };
    const handler = createAuthenticatedVocabularyGenerationHandler({
      identity: identity({
        kind: "authenticated",
        subjectId: "learner-1",
        sessionId: "session-1",
        audience: "learner",
        expiresAt: new Date("2027-01-01T00:00:00.000Z"),
      }),
      drafts,
      generate: () => Promise.resolve(generated),
      now: () => new Date("2026-08-05T01:00:00.000Z"),
      createDraftId: () => "draft-1",
    });

    const response = await handler(request());

    expect(response.status).toBe(200);
    expect(saved).toMatchObject({
      draftId: "draft-1",
      subjectId: "learner-1",
      expiresAt: "2026-08-05T01:30:00.000Z",
      draft: {
        version: "vocabulary-generation-draft-v1",
        title: "Food vocabulary",
        level: "B1",
      },
    });
    await expect(response.json()).resolves.toMatchObject({
      draft: {
        draftId: "draft-1",
        expiresAt: "2026-08-05T01:30:00.000Z",
      },
      generation: { title: "Food vocabulary" },
    });
  });

  it("returns 409 when draft persistence conflicts", async () => {
    const handler = createAuthenticatedVocabularyGenerationHandler({
      identity: identity({
        kind: "authenticated",
        subjectId: "learner-1",
        sessionId: "session-1",
        audience: "learner",
        expiresAt: new Date("2027-01-01T00:00:00.000Z"),
      }),
      drafts: {
        save() {
          return Promise.resolve({ created: false });
        },
      },
      generate: () => Promise.resolve(generated),
      createDraftId: () => "duplicate",
    });

    expect((await handler(request())).status).toBe(409);
  });
});
