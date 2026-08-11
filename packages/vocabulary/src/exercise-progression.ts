import { LEARNING_ALGORITHM_VERSION, type MasteryProjection } from "./learning-engine.js";

export type ProgressiveExerciseMode = "definition-choice" | "verified-cloze" | "typed-recall";
export type ExerciseProgressionReason =
  | "new-recognition"
  | "contextual-retrieval"
  | "lapse-recovery"
  | "productive-recall"
  | "capability-fallback"
  | "no-verified-capability";

export interface ExerciseProgressionPlan {
  readonly algorithmVersion: "exercise-progression-v1";
  readonly preferredMode: ProgressiveExerciseMode;
  readonly selectedMode: ProgressiveExerciseMode | "unavailable";
  readonly reason: ExerciseProgressionReason;
}

function preferred(projection: MasteryProjection): {
  readonly mode: ProgressiveExerciseMode;
  readonly reason: Exclude<
    ExerciseProgressionReason,
    "capability-fallback" | "no-verified-capability"
  >;
} {
  const recoveringFromLapse = projection.lapses > 0 && projection.stabilityDays === 0.25;
  if (recoveringFromLapse) return { mode: "definition-choice", reason: "lapse-recovery" };
  if (projection.state === "new") return { mode: "definition-choice", reason: "new-recognition" };
  if (projection.successfulRetrievals >= 4 && projection.masteryScore >= 0.6) {
    return { mode: "typed-recall", reason: "productive-recall" };
  }
  return { mode: "verified-cloze", reason: "contextual-retrieval" };
}

function fallbackOrder(mode: ProgressiveExerciseMode): readonly ProgressiveExerciseMode[] {
  if (mode === "typed-recall") return ["typed-recall", "verified-cloze", "definition-choice"];
  if (mode === "verified-cloze") return ["verified-cloze", "definition-choice"];
  return ["definition-choice", "verified-cloze"];
}

export function planExerciseProgression(
  projection: MasteryProjection,
  availableModes: readonly ProgressiveExerciseMode[],
): ExerciseProgressionPlan {
  const projectionVersion: string = projection.algorithmVersion;
  if (projectionVersion !== LEARNING_ALGORITHM_VERSION) {
    return Object.freeze({
      algorithmVersion: "exercise-progression-v1",
      preferredMode: "definition-choice",
      selectedMode: "unavailable",
      reason: "no-verified-capability",
    });
  }

  const target = preferred(projection);
  const available = new Set(availableModes);
  const selectedMode = fallbackOrder(target.mode).find((mode) => available.has(mode));
  if (!selectedMode) {
    return Object.freeze({
      algorithmVersion: "exercise-progression-v1",
      preferredMode: target.mode,
      selectedMode: "unavailable",
      reason: "no-verified-capability",
    });
  }
  return Object.freeze({
    algorithmVersion: "exercise-progression-v1",
    preferredMode: target.mode,
    selectedMode,
    reason: selectedMode === target.mode ? target.reason : "capability-fallback",
  });
}
