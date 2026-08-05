import type { PersistentDefinitionChoiceExercise } from "./definition-choice-persistence-mapper.js";
import type { VerifiedExercise } from "./exercise-composer.js";

export type PersistentPublishedExercise = VerifiedExercise | PersistentDefinitionChoiceExercise;

export interface PublishedExerciseSelection {
  readonly candidateId: string;
  readonly outcome:
    | {
        readonly outcome: "publish";
        readonly exercise: PersistentPublishedExercise;
      }
    | {
        readonly outcome: "request-ai-fallback" | "reject";
      };
}

export interface ClozeStudySessionExerciseSnapshot {
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

export interface DefinitionChoiceStudySessionExerciseSnapshot {
  readonly exerciseId: string;
  readonly exerciseKind: "definition-choice";
  readonly candidateId: string;
  readonly knowledgeId: string;
  readonly senseId: string;
  readonly prompt: string;
  readonly answer: string;
  readonly options: readonly [string, string, string, string];
  readonly choiceIds: readonly [string, string, string, string];
  readonly provenance: PersistentDefinitionChoiceExercise["provenance"];
}

export type StudySessionExerciseSnapshot =
  ClozeStudySessionExerciseSnapshot | DefinitionChoiceStudySessionExerciseSnapshot;

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

function fourValues(values: readonly string[]): readonly [string, string, string, string] {
  const [first, second, third, fourth] = values;

  if (
    first === undefined ||
    second === undefined ||
    third === undefined ||
    fourth === undefined ||
    values.length !== 4
  ) {
    throw new Error("Published exercise must contain exactly four values");
  }

  return Object.freeze([first, second, third, fourth]);
}

function snapshotExercise(exercise: PersistentPublishedExercise): StudySessionExerciseSnapshot {
  if (exercise.exerciseKind === "definition-choice") {
    return Object.freeze({
      exerciseId: exercise.exerciseId,
      exerciseKind: exercise.exerciseKind,
      candidateId: exercise.candidateId,
      knowledgeId: exercise.knowledgeId,
      senseId: exercise.senseId,
      prompt: exercise.prompt,
      answer: exercise.answer,
      options: fourValues(exercise.options),
      choiceIds: fourValues(exercise.choiceIds),
      provenance: Object.freeze([...exercise.provenance]),
    });
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
    options: fourValues(exercise.options),
    provenance: Object.freeze({
      ...exercise.provenance,
    }),
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
