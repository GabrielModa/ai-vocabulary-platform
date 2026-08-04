import type { ExercisePipelineOutcome } from "@vocabulary/domain-vocabulary";
import type { EnrichedVocabularySet } from "./lexical-enrichment";

export const VOCABULARY_GENERATION_RESPONSE_VERSION = "2026-08-04" as const;

export interface PublicPublishedExercise {
  readonly exerciseId: string;
  readonly exerciseKind: "cloze";
  readonly candidateId: string;
  readonly senseId: string;
  readonly exampleId: string;
  readonly sourceSentence: string;
  readonly gapSentence: string;
  readonly answer: string;
  readonly options: readonly string[];
  readonly provenance: {
    readonly exampleProvider: string;
    readonly exampleSourceRecordId: string;
    readonly lexicalProvider: string;
    readonly lexicalSourceRecordId: string;
  };
}

export type PublicExercisePipelineOutcome =
  | {
      readonly outcome: "publish";
      readonly pipeline: "verified-exercise-pipeline-v1";
      readonly semanticUniqueness: "not-proven";
      readonly exercise: PublicPublishedExercise;
    }
  | {
      readonly outcome: "request-ai-fallback";
      readonly pipeline: "verified-exercise-pipeline-v1";
      readonly semanticUniqueness: "not-proven";
      readonly operation: "rewrite-context-only";
      readonly requestId: string;
      readonly triggeringReasons: readonly string[];
    }
  | {
      readonly outcome: "reject";
      readonly pipeline: "verified-exercise-pipeline-v1";
      readonly semanticUniqueness: "not-proven";
      readonly stage: "composition" | "structural-policy";
      readonly compositionCode?: string;
      readonly structuralReasons: readonly string[];
    };

export interface PublicVocabularyGenerationResponse extends Omit<
  EnrichedVocabularySet,
  "candidates"
> {
  readonly responseVersion: typeof VOCABULARY_GENERATION_RESPONSE_VERSION;
  readonly candidates: readonly (Omit<
    EnrichedVocabularySet["candidates"][number],
    "exercisePipelineOutcome"
  > & {
    readonly exercisePipelineOutcome?: PublicExercisePipelineOutcome;
  })[];
}

export function toPublicExercisePipelineOutcome(
  outcome: ExercisePipelineOutcome,
): PublicExercisePipelineOutcome {
  if (outcome.outcome === "publish") {
    const { exercise } = outcome;
    return Object.freeze({
      outcome: "publish",
      pipeline: outcome.pipeline,
      semanticUniqueness: outcome.semanticUniqueness,
      exercise: Object.freeze({
        exerciseId: exercise.exerciseId,
        exerciseKind: exercise.exerciseKind,
        candidateId: exercise.candidateId,
        senseId: exercise.senseId,
        exampleId: exercise.exampleId,
        sourceSentence: exercise.sourceSentence,
        gapSentence: exercise.gapSentence,
        answer: exercise.answer,
        options: Object.freeze([...exercise.options]),
        provenance: Object.freeze({ ...exercise.provenance }),
      }),
    });
  }

  if (outcome.outcome === "request-ai-fallback") {
    return Object.freeze({
      outcome: "request-ai-fallback",
      pipeline: outcome.pipeline,
      semanticUniqueness: outcome.semanticUniqueness,
      operation: outcome.request.operation,
      requestId: outcome.request.requestId,
      triggeringReasons: Object.freeze([...outcome.request.triggeringReasons]),
    });
  }

  return Object.freeze({
    outcome: "reject",
    pipeline: outcome.pipeline,
    semanticUniqueness: outcome.semanticUniqueness,
    stage: outcome.stage,
    ...(outcome.compositionFailure ? { compositionCode: outcome.compositionFailure.code } : {}),
    structuralReasons: Object.freeze([...outcome.structuralReasons]),
  });
}

export function serializeVocabularyGenerationResponse(
  value: EnrichedVocabularySet,
): PublicVocabularyGenerationResponse {
  return Object.freeze({
    ...value,
    responseVersion: VOCABULARY_GENERATION_RESPONSE_VERSION,
    candidates: Object.freeze(
      value.candidates.map((candidate) => {
        const { exercisePipelineOutcome, ...base } = candidate;
        return Object.freeze({
          ...base,
          ...(exercisePipelineOutcome
            ? {
                exercisePipelineOutcome: toPublicExercisePipelineOutcome(exercisePipelineOutcome),
              }
            : {}),
        });
      }),
    ),
  });
}
