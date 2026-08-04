import type { StudySessionSnapshot } from "@vocabulary/domain-vocabulary";

export const STUDY_SESSION_RESPONSE_VERSION = "study-session-response-v1" as const;

export interface PublicStudySessionExercise {
  readonly exerciseId: string;
  readonly exerciseKind: "cloze";
  readonly gapSentence: string;
  readonly options: readonly [string, string, string, string];
}

export interface PublicStudySessionResponse {
  readonly responseVersion: typeof STUDY_SESSION_RESPONSE_VERSION;
  readonly sessionId: string;
  readonly snapshotVersion: "study-session-snapshot-v1";
  readonly title: string;
  readonly level: string;
  readonly createdAt: string;
  readonly exercises: readonly PublicStudySessionExercise[];
}

function serializeExercise(
  exercise: StudySessionSnapshot["exercises"][number],
): PublicStudySessionExercise {
  const [answer, first, second, third] = exercise.options;
  const options: [string, string, string, string] = [answer, first, second, third];

  return Object.freeze({
    exerciseId: exercise.exerciseId,
    exerciseKind: exercise.exerciseKind,
    gapSentence: exercise.gapSentence,
    options: Object.freeze(options),
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
