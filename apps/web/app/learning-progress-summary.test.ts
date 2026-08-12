import { describe, expect, it } from "vitest";

import type { CompletedStudySession } from "./local-study-history.js";
import { summarizeLocalLearningProgress } from "./learning-progress-summary.js";

function session(
  sessionId: string,
  completedAt: string,
  correct: boolean,
  term = "pitch",
): CompletedStudySession {
  return {
    version: 1,
    sessionId,
    completedAt,
    title: "Football",
    level: "B1",
    candidates: [
      {
        candidateId: `candidate:${term}`,
        term,
        meaning: "Verified meaning.",
        type: "noun",
        example: `The ${term} is ready.`,
        challenge: "The ___ is ready.",
      },
    ],
    selectedTerms: [term],
    attempts: [{ term, chosenTerm: correct ? term : "other", correct }],
    score: { correct: correct ? 1 : 0, attempted: 1, percentage: correct ? 100 : 0 },
  };
}

describe("local learning progress summary", () => {
  it("separates mastery states, due work, accuracy, and priorities", () => {
    const mastered = [1, 2, 3, 4, 5].map((day) =>
      session(
        `mastered-${String(day)}`,
        `2026-07-${String(day).padStart(2, "0")}T10:00:00.000Z`,
        true,
      ),
    );
    const history = [
      ...mastered,
      session("learning-1", "2026-08-10T10:00:00.000Z", true, "pass"),
      session("review-0", "2026-08-10T10:00:00.000Z", true, "referee"),
      session("review-1", "2026-08-11T10:00:00.000Z", false, "referee"),
    ];

    expect(summarizeLocalLearningProgress(history, "2026-08-20T12:00:00.000Z")).toEqual({
      totalItems: 3,
      states: { new: 0, learning: 1, review: 1, mastered: 1 },
      dueNow: 3,
      retrievals: { correct: 7, attempted: 8, accuracyPercentage: 88 },
      priorityTerms: ["referee", "pass", "pitch"],
      algorithmVersion: "lexi-spacing-v1",
    });
  });

  it("returns an immutable empty summary without history", () => {
    const summary = summarizeLocalLearningProgress([], "2026-08-20T12:00:00.000Z");
    expect(summary.totalItems).toBe(0);
    expect(summary.priorityTerms).toEqual([]);
    expect(Object.isFrozen(summary)).toBe(true);
    expect(Object.isFrozen(summary.states)).toBe(true);
  });
});
