import {
  selectDeterministicDistractors,
  type DistractorCandidateEvidence,
  type DistractorSelectionFailureCode,
} from "./distractor-selection.js";
import type { ExampleContent } from "./providers.js";
import { buildSenseBoundCloze, type ClozeBuildFailureCode } from "./sense-bound-cloze.js";

export type ExerciseCompositionFailureCode =
  | "missing-selected-sense"
  | "missing-verified-example"
  | "insufficient-compatible-distractors"
  | "no-valid-example";

export interface ExerciseCompositionFailure {
  readonly ok: false;
  readonly code: ExerciseCompositionFailureCode;
  readonly message: string;
  readonly attemptedExampleCount: number;
  readonly causes: readonly (
    | {
        readonly stage: "distractor-selection";
        readonly code: DistractorSelectionFailureCode;
      }
    | {
        readonly stage: "cloze-construction";
        readonly exampleId: string;
        readonly code: ClozeBuildFailureCode;
      }
  )[];
}

export interface VerifiedExercise {
  readonly ok: true;
  readonly exerciseId: string;
  readonly exerciseKind: "cloze";
  readonly candidateId: string;
  readonly senseId: string;
  readonly exampleId: string;
  readonly sourceSentence: string;
  readonly gapSentence: string;
  readonly answer: string;
  readonly options: readonly string[];
  readonly distractorCandidateIds: readonly string[];
  readonly provenance: {
    readonly exampleProvider: string;
    readonly exampleSourceRecordId: string;
    readonly lexicalProvider: string;
    readonly lexicalSourceRecordId: string;
  };
  readonly compositionStrategy: "verified-example-deterministic-distractors-sense-bound-cloze";
}

export type ExerciseCompositionResult = VerifiedExercise | ExerciseCompositionFailure;

export interface ComposeVerifiedExerciseInput {
  readonly answer: DistractorCandidateEvidence;
  readonly examples: readonly ExampleContent[];
  readonly distractorPool: readonly DistractorCandidateEvidence[];
}

function failure(
  code: ExerciseCompositionFailureCode,
  message: string,
  attemptedExampleCount: number,
  causes: ExerciseCompositionFailure["causes"],
): ExerciseCompositionFailure {
  return Object.freeze({
    ok: false,
    code,
    message,
    attemptedExampleCount,
    causes: Object.freeze([...causes]),
  });
}

function deterministicExerciseId(candidateId: string, senseId: string, exampleId: string): string {
  return [
    "exercise",
    encodeURIComponent(candidateId),
    encodeURIComponent(senseId),
    encodeURIComponent(exampleId),
    "cloze",
    "v1",
  ].join(":");
}

export function composeVerifiedExercise(
  input: ComposeVerifiedExerciseInput,
): ExerciseCompositionResult {
  const selectedSense = input.answer.candidate.selectedSense;
  if (!selectedSense) {
    return failure(
      "missing-selected-sense",
      "A confirmed lexical sense is required before composing an exercise",
      0,
      [],
    );
  }

  const compatibleExamples = input.examples.filter(
    (example) => example.senseId === selectedSense.senseId,
  );

  if (compatibleExamples.length === 0) {
    return failure(
      "missing-verified-example",
      "No verified example is available for the confirmed lexical sense",
      0,
      [],
    );
  }

  const distractorSelection = selectDeterministicDistractors({
    answer: input.answer,
    pool: input.distractorPool,
    count: 3,
  });

  if (!distractorSelection.ok) {
    return failure("insufficient-compatible-distractors", distractorSelection.message, 0, [
      {
        stage: "distractor-selection",
        code: distractorSelection.code,
      },
    ]);
  }

  const distractorLemmas = distractorSelection.distractors.map((distractor) => distractor.lemma);
  const causes: ExerciseCompositionFailure["causes"][number][] = [];

  for (const example of compatibleExamples) {
    const cloze = buildSenseBoundCloze({
      candidate: input.answer.candidate,
      example,
      distractors: distractorLemmas,
    });

    if (!cloze.ok) {
      causes.push({
        stage: "cloze-construction",
        exampleId: example.id,
        code: cloze.code,
      });
      continue;
    }

    const lexicalSourceRecordId = selectedSense.provenance.sourceId;
    if (!lexicalSourceRecordId) {
      causes.push({
        stage: "cloze-construction",
        exampleId: example.id,
        code: "missing-source-record-id",
      });
      continue;
    }

    return Object.freeze({
      ok: true,
      exerciseId: deterministicExerciseId(
        input.answer.candidate.candidateId,
        selectedSense.senseId,
        example.id,
      ),
      exerciseKind: "cloze",
      candidateId: input.answer.candidate.candidateId,
      senseId: selectedSense.senseId,
      exampleId: example.id,
      sourceSentence: cloze.sourceSentence,
      gapSentence: cloze.gapSentence,
      answer: cloze.answer,
      options: cloze.options,
      distractorCandidateIds: Object.freeze(
        distractorSelection.distractors.map((distractor) => distractor.candidateId),
      ),
      provenance: Object.freeze({
        exampleProvider: cloze.source.provider,
        exampleSourceRecordId: cloze.source.sourceRecordId,
        lexicalProvider: selectedSense.provenance.provider,
        lexicalSourceRecordId,
      }),
      compositionStrategy: "verified-example-deterministic-distractors-sense-bound-cloze",
    });
  }

  return failure(
    "no-valid-example",
    "Verified examples were found, but none could produce a valid cloze",
    compatibleExamples.length,
    causes,
  );
}
