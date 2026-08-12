import { describe, expect, it } from "vitest";
import { buildLocalLearningProfile, planLocalAdaptiveReview } from "../app/adaptive-local-review";
import type { CompletedStudySession } from "../app/local-study-history";

const candidate: CompletedStudySession["candidates"][number] = {
  candidateId: "candidate:pitch",
  senseId: "sense:pitch-field",
  term: "pitch",
  meaning: "the playing surface",
  type: "noun",
  example: "The pitch is wet.",
  challenge: "The players entered the ___.",
};

function completed(
  sessionId: string,
  completedAt: string,
  correct: boolean,
): CompletedStudySession {
  return {
    version: 1,
    sessionId,
    completedAt,
    title: "Adaptive review",
    level: "B1",
    candidates: [candidate],
    selectedTerms: [candidate.term],
    attempts: [
      {
        term: candidate.term,
        chosenTerm: correct ? candidate.term : "field",
        correct,
      },
    ],
    score: {
      correct: correct ? 1 : 0,
      attempted: 1,
      percentage: correct ? 100 : 0,
    },
  };
}

describe("adaptive learning loop", () => {
  it("raises difficulty after success and schedules a lapsed typed response for early review", () => {
    const successfulHistory = [
      completed("session-1", "2026-08-01T10:00:00.000Z", true),
      completed("session-2", "2026-08-02T10:00:00.000Z", true),
      completed("session-3", "2026-08-05T10:00:00.000Z", true),
      completed("session-4", "2026-08-12T10:00:00.000Z", true),
    ];
    const productivePlan = planLocalAdaptiveReview(
      successfulHistory,
      "2026-08-27T10:00:00.000Z",
      1,
    );
    expect(productivePlan?.items[0]).toMatchObject({
      reason: "due-review",
      exerciseProgression: {
        selectedMode: "typed-recall",
        reason: "productive-recall",
      },
    });

    const lapsedHistory = [
      ...successfulHistory,
      completed("session-5", "2026-08-27T10:00:00.000Z", false),
    ];
    const projection = buildLocalLearningProfile(lapsedHistory)[0]?.projection;
    expect(projection).toMatchObject({
      successfulRetrievals: 4,
      lapses: 1,
      stabilityDays: 0.25,
      nextReviewAt: "2026-08-27T16:00:00.000Z",
    });
    expect(
      planLocalAdaptiveReview(lapsedHistory, "2026-08-27T17:00:00.000Z", 1)?.items[0],
    ).toMatchObject({
      reason: "lapsed-due",
      exerciseProgression: {
        selectedMode: "definition-choice",
        reason: "lapse-recovery",
      },
    });
  });
});
