import type { StudySessionSnapshot } from "@vocabulary/domain-vocabulary";

type SnapshotExercise = StudySessionSnapshot["exercises"][number];

export interface PublicClozeStudySessionExercise {
  readonly exerciseId: string;
  readonly exerciseKind: "cloze";
  readonly gapSentence: string;
  readonly options: readonly [string, string, string, string];
}

export interface PublicDefinitionChoiceStudySessionExercise {
  readonly exerciseId: string;
  readonly exerciseKind: "definition-choice";
  readonly prompt: string;
  readonly options: readonly [string, string, string, string];
}

export type PublicStudySessionExercise =
  PublicClozeStudySessionExercise | PublicDefinitionChoiceStudySessionExercise;

export type EvaluateStudySessionExerciseAnswerResult =
  | {
      readonly ok: true;
      readonly exerciseId: string;
      readonly selectedOption: string;
      readonly correct: boolean;
      readonly correctAnswer: string;
    }
  | {
      readonly ok: false;
      readonly code: "INVALID_STUDY_SESSION_OPTION";
      readonly message: string;
    };

function copyOptions(
  options: SnapshotExercise["options"],
): readonly [string, string, string, string] {
  const [first, second, third, fourth] = options;

  return Object.freeze([first, second, third, fourth]);
}

export function serializeStudySessionExercise(
  exercise: SnapshotExercise,
): PublicStudySessionExercise {
  const base = {
    exerciseId: exercise.exerciseId,
    exerciseKind: exercise.exerciseKind,
    options: copyOptions(exercise.options),
  };

  return exercise.exerciseKind === "cloze"
    ? Object.freeze({
        ...base,
        exerciseKind: "cloze" as const,
        gapSentence: exercise.gapSentence,
      })
    : Object.freeze({
        ...base,
        exerciseKind: "definition-choice" as const,
        prompt: exercise.prompt,
      });
}

export function evaluateStudySessionExerciseAnswer(
  exercise: SnapshotExercise,
  selectedOption: string,
): EvaluateStudySessionExerciseAnswerResult {
  const normalizedOption = selectedOption.normalize("NFKC").trim();

  if (!exercise.options.includes(normalizedOption)) {
    return Object.freeze({
      ok: false,
      code: "INVALID_STUDY_SESSION_OPTION",
      message: "Selected option is not available for this exercise",
    });
  }

  return Object.freeze({
    ok: true,
    exerciseId: exercise.exerciseId,
    selectedOption: normalizedOption,
    correct: normalizedOption === exercise.answer,
    correctAnswer: exercise.answer,
  });
}
