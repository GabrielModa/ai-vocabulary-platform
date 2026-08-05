import type {
  PersistentPublishedExercise,
  PublishedExerciseSelection,
} from "@vocabulary/domain-vocabulary";
import { describe, expect, it } from "vitest";
import { chooseReviewedExerciseOutcome } from "./reviewed-exercise-strategy";

type ExerciseOutcome = PublishedExerciseSelection["outcome"];

function published(exerciseKind: "cloze" | "definition-choice"): ExerciseOutcome {
  return {
    outcome: "publish",
    exercise: { exerciseKind } as PersistentPublishedExercise,
  };
}

describe("reviewed exercise strategy", () => {
  it("prefers verified cloze", () => {
    expect(
      chooseReviewedExerciseOutcome({
        legacyOutcome: published("cloze"),
        definitionChoiceOutcome: published("definition-choice"),
      }),
    ).toMatchObject({ outcome: "publish", exercise: { exerciseKind: "cloze" } });
  });

  it("falls back to definition choice", () => {
    expect(
      chooseReviewedExerciseOutcome({
        legacyOutcome: { outcome: "reject" },
        definitionChoiceOutcome: published("definition-choice"),
      }),
    ).toMatchObject({
      outcome: "publish",
      exercise: { exerciseKind: "definition-choice" },
    });
  });

  it("preserves legacy non-publish outcome", () => {
    expect(
      chooseReviewedExerciseOutcome({
        legacyOutcome: { outcome: "request-ai-fallback" },
        definitionChoiceOutcome: { outcome: "reject" },
      }),
    ).toEqual({ outcome: "request-ai-fallback" });
  });

  it("rejects when no outcome exists", () => {
    expect(chooseReviewedExerciseOutcome({})).toEqual({ outcome: "reject" });
  });
});
