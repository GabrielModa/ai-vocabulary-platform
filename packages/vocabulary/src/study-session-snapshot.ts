import type { VerifiedExercise } from "./exercise-composer.js";

export interface PublishedExerciseSelection {
  readonly candidateId: string;
  readonly outcome:
    | {
        readonly outcome: "publish";
        readonly exercise: VerifiedExercise;
      }
    | {
        readonly outcome: "request-ai-fallback" | "reject";
      };
}

export interface StudySessionExerciseSnapshot {
  readonly exerciseId: string;
  readonly exerciseKind: "cloze";
  readonly candidateId: string;
  readonly senseId: string;
  readonly exampleId: string;
  readonly sourceSentence: string;
  readonly gapSentence: string;
  readonly answer: string;
  readonly options: readonly [string, string, string, string];
  readonly provenance: {
    readonly exampleProvider: string;
    readonly exampleSourceRecordId: string;
    readonly lexicalProvider: string;
    readonly lexicalSourceRecordId: string;
  };
}

export interface StudySessionSnapshot {
  readonly sessionId: string;
  readonly snapshotVersion: "study-session-snapshot-v1";
  readonly title: string;
  readonly level: string;
  readonly createdAt: string;
  readonly exerciseIds: readonly string[];
  readonly exercises: readonly StudySessionExerciseSnapshot[];
}

export type StudySessionSnapshotFailureCode =
  "invalid-title" | "invalid-level" | "invalid-created-at" | "no-published-exercises";

export type BuildStudySessionSnapshotResult =
  | {
      readonly ok: true;
      readonly snapshot: StudySessionSnapshot;
      readonly omittedCandidateIds: readonly string[];
    }
  | {
      readonly ok: false;
      readonly code: StudySessionSnapshotFailureCode;
      readonly message: string;
    };

export interface BuildStudySessionSnapshotInput {
  readonly title: string;
  readonly level: string;
  readonly createdAt: string;
  readonly selectedCandidateIds: readonly string[];
  readonly candidates: readonly PublishedExerciseSelection[];
}

function normalizedText(value: string): string {
  return value.normalize("NFKC").replace(/\s+/gu, " ").trim();
}

function stableUnique(values: readonly string[]): readonly string[] {
  return Object.freeze([...new Set(values)]);
}

function snapshotExercise(exercise: VerifiedExercise): StudySessionExerciseSnapshot {
  const [answer, first, second, third] = exercise.options;
  if (answer === undefined || first === undefined || second === undefined || third === undefined) {
    throw new Error("Verified exercise must contain exactly four options");
  }

  return Object.freeze({
    exerciseId: exercise.exerciseId,
    exerciseKind: exercise.exerciseKind,
    candidateId: exercise.candidateId,
    senseId: exercise.senseId,
    exampleId: exercise.exampleId,
    sourceSentence: exercise.sourceSentence,
    gapSentence: exercise.gapSentence,
    answer: exercise.answer,
    options: Object.freeze([answer, first, second, third] as [string, string, string, string]),
    provenance: Object.freeze({ ...exercise.provenance }),
  });
}

function sessionId(createdAt: string, exerciseIds: readonly string[]): string {
  return [
    "study-session",
    encodeURIComponent(createdAt),
    encodeURIComponent(exerciseIds.join(",")),
    "v1",
  ].join(":");
}

export function buildStudySessionSnapshot(
  input: BuildStudySessionSnapshotInput,
): BuildStudySessionSnapshotResult {
  const title = normalizedText(input.title);
  if (!title) {
    return Object.freeze({
      ok: false,
      code: "invalid-title",
      message: "Study session title is required",
    });
  }

  const level = normalizedText(input.level);
  if (!level) {
    return Object.freeze({
      ok: false,
      code: "invalid-level",
      message: "Study session level is required",
    });
  }

  const createdAt = input.createdAt.trim();
  if (
    !createdAt ||
    Number.isNaN(Date.parse(createdAt)) ||
    new Date(createdAt).toISOString() !== createdAt
  ) {
    return Object.freeze({
      ok: false,
      code: "invalid-created-at",
      message: "createdAt must be a canonical ISO timestamp",
    });
  }

  const byCandidateId = new Map(
    input.candidates.map((candidate) => [candidate.candidateId, candidate]),
  );
  const selectedCandidateIds = stableUnique(
    input.selectedCandidateIds.map((candidateId) => candidateId.normalize("NFKC").trim()),
  ).filter(Boolean);

  const exercises: StudySessionExerciseSnapshot[] = [];
  const omittedCandidateIds: string[] = [];
  const includedExerciseIds = new Set<string>();

  for (const candidateId of selectedCandidateIds) {
    const candidate = byCandidateId.get(candidateId);
    if (candidate?.outcome.outcome !== "publish") {
      omittedCandidateIds.push(candidateId);
      continue;
    }

    const exercise = candidate.outcome.exercise;
    if (exercise.candidateId !== candidateId || includedExerciseIds.has(exercise.exerciseId)) {
      omittedCandidateIds.push(candidateId);
      continue;
    }

    includedExerciseIds.add(exercise.exerciseId);
    exercises.push(snapshotExercise(exercise));
  }

  if (exercises.length === 0) {
    return Object.freeze({
      ok: false,
      code: "no-published-exercises",
      message: "At least one selected published exercise is required",
    });
  }

  const frozenExercises = Object.freeze(exercises);
  const exerciseIds = Object.freeze(frozenExercises.map((exercise) => exercise.exerciseId));

  return Object.freeze({
    ok: true,
    snapshot: Object.freeze({
      sessionId: sessionId(createdAt, exerciseIds),
      snapshotVersion: "study-session-snapshot-v1",
      title,
      level,
      createdAt,
      exerciseIds,
      exercises: frozenExercises,
    }),
    omittedCandidateIds: Object.freeze(omittedCandidateIds),
  });
}
