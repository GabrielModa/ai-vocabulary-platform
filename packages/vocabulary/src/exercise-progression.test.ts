import { describe, expect, it } from "vitest";
import { createMasteryProjection, type MasteryProjection } from "./learning-engine.js";
import { planExerciseProgression } from "./exercise-progression.js";

function projection(overrides: Partial<MasteryProjection> = {}): MasteryProjection {
  return Object.freeze({ ...createMasteryProjection("knowledge:term"), ...overrides });
}

const allModes = ["definition-choice", "verified-cloze", "typed-recall"] as const;

describe("mastery-based exercise progression", () => {
  it("starts with supported recognition without treating CEFR as mastery", () => {
    expect(planExerciseProgression(projection(), allModes)).toMatchObject({
      algorithmVersion: "exercise-progression-v1",
      selectedMode: "definition-choice",
      reason: "new-recognition",
    });
  });

  it("moves learning knowledge to contextual retrieval", () => {
    expect(
      planExerciseProgression(
        projection({ state: "learning", successfulRetrievals: 1, masteryScore: 0.18 }),
        allModes,
      ),
    ).toMatchObject({ selectedMode: "verified-cloze", reason: "contextual-retrieval" });
  });

  it("returns a lapsed item to recognition before raising difficulty again", () => {
    expect(
      planExerciseProgression(
        projection({
          state: "review",
          lapses: 1,
          successfulRetrievals: 3,
          masteryScore: 0.29,
          stabilityDays: 0.25,
        }),
        allModes,
      ),
    ).toMatchObject({ selectedMode: "definition-choice", reason: "lapse-recovery" });
  });

  it("uses typed recall only after enough successful retrievals", () => {
    expect(
      planExerciseProgression(
        projection({ state: "review", successfulRetrievals: 4, masteryScore: 0.72 }),
        allModes,
      ),
    ).toMatchObject({ selectedMode: "typed-recall", reason: "productive-recall" });
    expect(
      planExerciseProgression(
        projection({ state: "mastered", successfulRetrievals: 6, masteryScore: 0.9 }),
        allModes,
      ).selectedMode,
    ).toBe("typed-recall");
  });

  it("falls back to the strongest available verified mode deterministically", () => {
    expect(
      planExerciseProgression(
        projection({ state: "review", successfulRetrievals: 4, masteryScore: 0.72 }),
        ["definition-choice", "verified-cloze"],
      ),
    ).toMatchObject({
      selectedMode: "verified-cloze",
      reason: "capability-fallback",
      preferredMode: "typed-recall",
    });
  });

  it("returns unavailable when no safe mode can be published", () => {
    expect(planExerciseProgression(projection(), [])).toMatchObject({
      selectedMode: "unavailable",
      reason: "no-verified-capability",
    });
  });
});
