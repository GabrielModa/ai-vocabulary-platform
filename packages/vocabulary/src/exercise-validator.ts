import { verifiedExerciseId, type VerifiedExercise } from "./exercise-composer.js";

export type ExerciseValidationReason =
  | "invalid-exercise-kind"
  | "missing-identifier"
  | "exercise-id-mismatch"
  | "invalid-gap-count"
  | "invalid-option-count"
  | "duplicate-option"
  | "answer-not-present-once"
  | "invalid-distractor-reference-count"
  | "duplicate-distractor-reference"
  | "missing-provenance"
  | "invalid-composition-strategy";

export interface ExerciseValidationIssue {
  readonly reason: ExerciseValidationReason;
  readonly field: string;
  readonly message: string;
}

export interface ExerciseValidationInput extends Omit<
  VerifiedExercise,
  "exerciseKind" | "compositionStrategy"
> {
  readonly exerciseKind: string;
  readonly compositionStrategy: string;
}

export interface ReadyExerciseValidation {
  readonly ready: true;
  readonly status: "structurally-ready";
  readonly exercise: VerifiedExercise;
  readonly issues: readonly [];
  readonly semanticUniqueness: "not-evaluated";
}

export interface NotReadyExerciseValidation {
  readonly ready: false;
  readonly status: "not-ready";
  readonly exercise: ExerciseValidationInput;
  readonly issues: readonly ExerciseValidationIssue[];
  readonly semanticUniqueness: "not-evaluated";
}

export type ExerciseValidationResult = ReadyExerciseValidation | NotReadyExerciseValidation;

const NO_ISSUES: readonly [] = Object.freeze([]);

function normalized(value: string): string {
  return value.normalize("NFKC").toLocaleLowerCase("en-US").trim();
}

function issue(
  reason: ExerciseValidationReason,
  field: string,
  message: string,
): ExerciseValidationIssue {
  return Object.freeze({ reason, field, message });
}

function missing(value: string): boolean {
  return value.trim().length === 0;
}

function isVerifiedExercise(exercise: ExerciseValidationInput): exercise is VerifiedExercise {
  return (
    exercise.exerciseKind === "cloze" &&
    exercise.compositionStrategy === "verified-example-deterministic-distractors-sense-bound-cloze"
  );
}

export function validateVerifiedExercise(
  exercise: ExerciseValidationInput,
): ExerciseValidationResult {
  const issues: ExerciseValidationIssue[] = [];

  if (exercise.exerciseKind !== "cloze") {
    issues.push(
      issue("invalid-exercise-kind", "exerciseKind", "Verified exercise kind must be cloze"),
    );
  }

  const identifiers = [
    ["exerciseId", exercise.exerciseId],
    ["candidateId", exercise.candidateId],
    ["senseId", exercise.senseId],
    ["exampleId", exercise.exampleId],
  ] as const;

  for (const [field, value] of identifiers) {
    if (missing(value)) {
      issues.push(issue("missing-identifier", field, `${field} must not be empty`));
    }
  }

  if (
    !missing(exercise.candidateId) &&
    !missing(exercise.senseId) &&
    !missing(exercise.exampleId) &&
    exercise.exerciseId !==
      verifiedExerciseId(exercise.candidateId, exercise.senseId, exercise.exampleId)
  ) {
    issues.push(
      issue(
        "exercise-id-mismatch",
        "exerciseId",
        "Exercise ID does not match its candidate, sense, example, kind, and version",
      ),
    );
  }

  const gapCount = exercise.gapSentence.match(/___/gu)?.length ?? 0;
  if (gapCount !== 1) {
    issues.push(
      issue("invalid-gap-count", "gapSentence", "Cloze exercise must contain exactly one gap"),
    );
  }

  if (exercise.options.length !== 4) {
    issues.push(
      issue("invalid-option-count", "options", "Cloze exercise must contain exactly four options"),
    );
  }

  const normalizedOptions = exercise.options.map(normalized);
  if (
    normalizedOptions.some((option) => option.length === 0) ||
    new Set(normalizedOptions).size !== normalizedOptions.length
  ) {
    issues.push(
      issue("duplicate-option", "options", "Exercise options must be non-empty and unique"),
    );
  }

  const normalizedAnswer = normalized(exercise.answer);
  const answerOccurrences = normalizedOptions.filter(
    (option) => option === normalizedAnswer,
  ).length;
  if (!normalizedAnswer || answerOccurrences !== 1) {
    issues.push(
      issue(
        "answer-not-present-once",
        "answer",
        "The answer must appear in the options exactly once",
      ),
    );
  }

  if (exercise.distractorCandidateIds.length !== 3) {
    issues.push(
      issue(
        "invalid-distractor-reference-count",
        "distractorCandidateIds",
        "Exactly three distractor candidate references are required",
      ),
    );
  }

  const normalizedDistractorIds = exercise.distractorCandidateIds.map(normalized);
  if (
    normalizedDistractorIds.some((candidateId) => candidateId.length === 0) ||
    new Set(normalizedDistractorIds).size !== normalizedDistractorIds.length
  ) {
    issues.push(
      issue(
        "duplicate-distractor-reference",
        "distractorCandidateIds",
        "Distractor candidate references must be non-empty and unique",
      ),
    );
  }

  const provenanceValues = [
    exercise.provenance.exampleProvider,
    exercise.provenance.exampleSourceRecordId,
    exercise.provenance.lexicalProvider,
    exercise.provenance.lexicalSourceRecordId,
  ];
  if (provenanceValues.some(missing)) {
    issues.push(
      issue("missing-provenance", "provenance", "Lexical and example provenance must be complete"),
    );
  }

  if (
    exercise.compositionStrategy !== "verified-example-deterministic-distractors-sense-bound-cloze"
  ) {
    issues.push(
      issue(
        "invalid-composition-strategy",
        "compositionStrategy",
        "Exercise must use the verified deterministic composition strategy",
      ),
    );
  }

  if (issues.length === 0 && isVerifiedExercise(exercise)) {
    return Object.freeze({
      ready: true,
      status: "structurally-ready",
      exercise,
      issues: NO_ISSUES,
      semanticUniqueness: "not-evaluated",
    });
  }

  return Object.freeze({
    ready: false,
    status: "not-ready",
    exercise,
    issues: Object.freeze(issues),
    semanticUniqueness: "not-evaluated",
  });
}
