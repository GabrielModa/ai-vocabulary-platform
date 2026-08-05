import type { StudySessionSnapshot } from "@vocabulary/domain-vocabulary";
import {
  serializeStudySessionExercise,
  type PublicStudySessionExercise,
} from "../../../src/study-session-exercise-runtime";

export const STUDY_SESSION_RESPONSE_VERSION = "study-session-response-v1" as const;

export type { PublicStudySessionExercise };

export interface PublicStudySessionResponse {
  readonly responseVersion: typeof STUDY_SESSION_RESPONSE_VERSION;
  readonly sessionId: string;
  readonly snapshotVersion: "study-session-snapshot-v1";
  readonly title: string;
  readonly level: string;
  readonly createdAt: string;
  readonly exercises: readonly PublicStudySessionExercise[];
}

export function serializeStudySession(snapshot: StudySessionSnapshot): PublicStudySessionResponse {
  return Object.freeze({
    responseVersion: STUDY_SESSION_RESPONSE_VERSION,
    sessionId: snapshot.sessionId,
    snapshotVersion: snapshot.snapshotVersion,
    title: snapshot.title,
    level: snapshot.level,
    createdAt: snapshot.createdAt,
    exercises: Object.freeze(snapshot.exercises.map(serializeStudySessionExercise)),
  });
}
