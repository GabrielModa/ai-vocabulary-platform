import type { StudySessionSnapshot } from "@vocabulary/domain-vocabulary";

export const STUDY_SESSION_RESPONSE_VERSION = "study-session-response-v1" as const;

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

export interface PublicStudySessionResponse {
  readonly responseVersion: typeof STUDY_SESSION_RESPONSE_VERSION;
  readonly sessionId: string;
  readonly snapshotVersion: "study-session-snapshot-v1";
  readonly title: string;
  readonly level: string;
  readonly createdAt: string;
  readonly exercises: readonly PublicStudySessionExercise[];
}

function copyOptions(
  values: readonly [string, string, string, string],
): readonly [string, string, string, string] {
  const [first, second, third, fourth] = values;

  return Object.freeze([first, second, third, fourth]);
}

function serializeExercise(
  exercise: StudySessionSnapshot["exercises"][number],
): PublicStudySessionExercise {
  if (exercise.exerciseKind === "definition-choice") {
    return Object.freeze({
      exerciseId: exercise.exerciseId,
      exerciseKind: exercise.exerciseKind,
      prompt: exercise.prompt,
      options: copyOptions(exercise.options),
    });
  }

  return Object.freeze({
    exerciseId: exercise.exerciseId,
    exerciseKind: exercise.exerciseKind,
    gapSentence: exercise.gapSentence,
    options: copyOptions(exercise.options),
  });
}

export function serializeStudySession(snapshot: StudySessionSnapshot): PublicStudySessionResponse {
  return Object.freeze({
    responseVersion: STUDY_SESSION_RESPONSE_VERSION,
    sessionId: snapshot.sessionId,
    snapshotVersion: snapshot.snapshotVersion,
    title: snapshot.title,
    level: snapshot.level,
    createdAt: snapshot.createdAt,
    exercises: Object.freeze(snapshot.exercises.map(serializeExercise)),
  });
}
