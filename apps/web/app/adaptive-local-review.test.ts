import { describe, expect, it } from "vitest";
import type { CompletedStudySession } from "./local-study-history.js";
import { buildLocalLearningProfile, planLocalAdaptiveReview } from "./adaptive-local-review.js";

function session(
  sessionId: string,
  completedAt: string,
  attempts: CompletedStudySession["attempts"],
): CompletedStudySession {
  return {
    version: 1,
    sessionId,
    completedAt,
    title: "Football",
    level: "B1",
    candidates: [
      {
        candidateId: "candidate:pitch",
        senseId: "sense:pitch-field",
        term: "Pitch",
        meaning: "The playing surface.",
        type: "noun",
        example: "The pitch is wet.",
        challenge: "The players entered the ___.",
      },
      {
        candidateId: "candidate:pass",
        term: "Pass",
        meaning: "Send the ball to a teammate.",
        type: "verb",
        example: "Pass the ball.",
        challenge: "Please ___ the ball.",
      },
    ],
    selectedTerms: ["Pitch", "Pass"],
    attempts,
    score: {
      correct: attempts.filter(({ correct, voided }) => correct && !voided).length,
      attempted: attempts.filter(({ voided }) => !voided).length,
      percentage: 0,
    },
  };
}

describe("local adaptive review", () => {
  it("prefers sense identity and falls back to normalized term and part of speech", () => {
    const profile = buildLocalLearningProfile([
      session("session-1", "2026-08-10T10:00:00.000Z", [
        { term: "Pitch", chosenTerm: "Pitch", correct: true },
        { term: "Pass", chosenTerm: "Pitch", correct: false },
      ]),
    ]);
    expect(profile.map(({ knowledgeId }) => knowledgeId)).toEqual([
      "sense:sense:pitch-field",
      "term:pass:verb",
    ]);
    expect(profile[0]?.projection.successfulRetrievals).toBe(1);
    expect(profile[1]?.projection.lapses).toBe(1);
  });

  it("excludes voided attempts from mastery evidence", () => {
    const profile = buildLocalLearningProfile([
      session("session-1", "2026-08-10T10:00:00.000Z", [
        { term: "Pitch", chosenTerm: "Pass", correct: false, voided: true },
      ]),
    ]);
    expect(profile.find(({ candidate }) => candidate.term === "Pitch")?.projection.state).toBe(
      "new",
    );
  });

  it("replays repeated evidence and creates a deterministic review plan", () => {
    const history = [
      session("session-2", "2026-08-12T10:00:00.000Z", [
        { term: "Pitch", chosenTerm: "Pitch", correct: true },
      ]),
      session("session-1", "2026-08-10T10:00:00.000Z", [
        { term: "Pitch", chosenTerm: "Pass", correct: false },
        { term: "Pass", chosenTerm: "Pass", correct: true },
      ]),
    ];
    const plan = planLocalAdaptiveReview(history, "2026-08-20T12:00:00.000Z", 4);
    expect(plan?.items.map(({ candidate }) => candidate.term)).toEqual(["Pitch", "Pass"]);
    expect(plan?.counts.due).toBe(2);
    expect(Object.isFrozen(plan?.items)).toBe(true);
  });

  it("attaches productive recall only after repeated successful retrieval", () => {
    const history = [1, 2, 3, 4].map((number) =>
      session(
        `session-${String(number)}`,
        `2026-08-${String(number).padStart(2, "0")}T10:00:00.000Z`,
        [{ term: "Pitch", chosenTerm: "Pitch", correct: true }],
      ),
    );

    const plan = planLocalAdaptiveReview(history, "2026-09-20T12:00:00.000Z", 2);
    expect(
      plan?.items.find(({ candidate }) => candidate.term === "Pitch")?.exerciseProgression,
    ).toMatchObject({
      selectedMode: "typed-recall",
      reason: "productive-recall",
    });
  });

  it("returns no plan for empty history", () => {
    expect(planLocalAdaptiveReview([], "2026-08-20T12:00:00.000Z", 10)).toBeUndefined();
  });
});
