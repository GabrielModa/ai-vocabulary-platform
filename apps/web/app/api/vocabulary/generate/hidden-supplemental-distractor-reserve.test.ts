import type { SessionIdentityPort } from "@vocabulary/auth";
import type { EnrichedVocabularySet } from "./lexical-enrichment";
import { describe, expect, it, vi } from "vitest";
import type { SaveTrustedGenerationDraftInput } from "../../../../src/study-session-drafts";
import { createAuthenticatedVocabularyGenerationHandler } from "./authenticated-generation";

const visibleCandidate = {
  term: "player",
  meaning: "a person who takes part in a game",
  type: "noun" as const,
  example: "The player passed the ball.",
  challenge: "The ___ passed the ball.",
  candidateId: "candidate:player",
  normalizedLemma: "player",
  selectionReasons: [],
  lexicalValidationStatus: "verified" as const,
  rank: 1,
  rankingScore: 1,
  rankingContributions: [],
  qualityReport: {
    candidateId: "candidate:player",
    decision: "accept" as const,
    exerciseReadiness: "ready" as const,
    overallScore: 80,
    dimensions: {
      lexicalCoverage: 100,
      exerciseReadiness: 70,
      exampleCoverage: 60,
      frequencyEvidence: 0,
      ambiguityRisk: 0,
    },
    reasonCodes: ["verified-sense", "definition-exercise-ready"],
  },
};

const generated: EnrichedVocabularySet = {
  title: "Football vocabulary",
  candidateStrategy: "suggest-verify-select",
  rankingStrategy: "deterministic-weighted-ranking",
  qualitySummary: {
    requestedCount: 1,
    evaluatedCount: 1,
    acceptedCount: 1,
    reviewCount: 0,
    rejectedCount: 0,
    usableCount: 1,
    deficitCount: 0,
    coveragePercentage: 100,
    averageScore: 80,
    qualityBand: "high",
  },
  generationFulfillment: {
    status: "exact",
    requestedCount: 1,
    deliveredCount: 1,
    deficitCount: 0,
    attempts: 1,
  },
  rejectedCandidates: [],
  candidates: [visibleCandidate],
};

function learnerIdentity(): SessionIdentityPort<Headers> {
  return {
    resolve() {
      return Promise.resolve({
        kind: "authenticated" as const,
        subjectId: "learner-1",
        sessionId: "session-1",
        audience: "learner" as const,
        expiresAt: new Date("2027-01-01T00:00:00.000Z"),
      });
    },
  };
}

describe("hidden supplemental distractor reserve", () => {
  it("persists supplemental candidates without exposing them in the generation response", async () => {
    let saved: SaveTrustedGenerationDraftInput | undefined;
    const supplemental = {
      ...visibleCandidate,
      term: "referee",
      candidateId: "candidate:referee",
      normalizedLemma: "referee",
      qualityReport: { ...visibleCandidate.qualityReport, candidateId: "candidate:referee" },
    };

    const handler = createAuthenticatedVocabularyGenerationHandler({
      identity: learnerIdentity(),
      drafts: {
        save(input) {
          saved = input;
          return Promise.resolve({ created: true });
        },
      },
      generate: () => Promise.resolve(generated),
      generateSupplemental: () => Promise.resolve([supplemental]),
      now: () => new Date("2026-08-13T00:00:00.000Z"),
      createDraftId: () => "draft-hidden-reserve",
    });

    const response = await handler(
      new Request("http://localhost/api/vocabulary/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ topic: "football", requestedCount: 1, level: "A2" }),
      }),
    );

    expect(response.status).toBe(200);
    expect(saved?.draft.sourceCandidates?.map(({ candidateId }) => candidateId)).toEqual([
      "candidate:player",
      "candidate:referee",
    ]);
    expect(saved?.draft.candidates.map(({ candidateId }) => candidateId)).toEqual([
      "candidate:player",
    ]);

    const body = (await response.json()) as {
      generation: { candidates: { candidateId: string }[] };
    };
    expect(body.generation.candidates.map(({ candidateId }) => candidateId)).toEqual([
      "candidate:player",
    ]);
  });

  it("keeps generation working when no supplemental generator is configured", async () => {
    const save = vi.fn(() => Promise.resolve({ created: true }));
    const handler = createAuthenticatedVocabularyGenerationHandler({
      identity: learnerIdentity(),
      drafts: { save },
      generate: () => Promise.resolve(generated),
      createDraftId: () => "draft-no-reserve",
    });

    const response = await handler(
      new Request("http://localhost/api/vocabulary/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ topic: "football", requestedCount: 1, level: "A2" }),
      }),
    );

    expect(response.status).toBe(200);
  });
});
