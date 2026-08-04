import { decideAiFallback, type AiFallbackRequest } from "./ai-fallback-policy.js";
import {
  composeVerifiedExercise,
  type ComposeVerifiedExerciseInput,
  type ExerciseCompositionFailure,
  type VerifiedExercise,
} from "./exercise-composer.js";
import type { ExerciseValidationReason } from "./exercise-validator.js";
import {
  evaluatePedagogicalReadiness,
  type PedagogicalReadinessIssue,
} from "./pedagogical-readiness.js";

export interface PublishExerciseOutcome {
  readonly outcome: "publish";
  readonly pipeline: "verified-exercise-pipeline-v1";
  readonly exercise: VerifiedExercise;
  readonly semanticUniqueness: "not-proven";
}

export interface RequestAiFallbackOutcome {
  readonly outcome: "request-ai-fallback";
  readonly pipeline: "verified-exercise-pipeline-v1";
  readonly exercise: VerifiedExercise;
  readonly request: AiFallbackRequest;
  readonly readinessIssues: readonly PedagogicalReadinessIssue[];
  readonly semanticUniqueness: "not-proven";
}

export interface RejectExerciseOutcome {
  readonly outcome: "reject";
  readonly pipeline: "verified-exercise-pipeline-v1";
  readonly stage: "composition" | "structural-policy";
  readonly compositionFailure?: ExerciseCompositionFailure;
  readonly structuralReasons: readonly ExerciseValidationReason[];
  readonly semanticUniqueness: "not-proven";
}

export type ExercisePipelineOutcome =
  PublishExerciseOutcome | RequestAiFallbackOutcome | RejectExerciseOutcome;

function rejectComposition(failure: ExerciseCompositionFailure): RejectExerciseOutcome {
  return Object.freeze({
    outcome: "reject",
    pipeline: "verified-exercise-pipeline-v1",
    stage: "composition",
    compositionFailure: failure,
    structuralReasons: Object.freeze([]),
    semanticUniqueness: "not-proven",
  });
}

export function runVerifiedExercisePipeline(
  input: ComposeVerifiedExerciseInput,
): ExercisePipelineOutcome {
  const composition = composeVerifiedExercise(input);
  if (!composition.ok) {
    return rejectComposition(composition);
  }

  const readiness = evaluatePedagogicalReadiness(composition);
  const fallbackDecision = decideAiFallback(readiness);

  if (fallbackDecision.decision === "not-required") {
    return Object.freeze({
      outcome: "publish",
      pipeline: "verified-exercise-pipeline-v1",
      exercise: composition,
      semanticUniqueness: "not-proven",
    });
  }

  if (fallbackDecision.decision === "allowed") {
    return Object.freeze({
      outcome: "request-ai-fallback",
      pipeline: "verified-exercise-pipeline-v1",
      exercise: composition,
      request: fallbackDecision.request,
      readinessIssues: readiness.ready ? Object.freeze([]) : readiness.issues,
      semanticUniqueness: "not-proven",
    });
  }

  return Object.freeze({
    outcome: "reject",
    pipeline: "verified-exercise-pipeline-v1",
    stage: "structural-policy",
    structuralReasons: fallbackDecision.structuralReasons,
    semanticUniqueness: "not-proven",
  });
}
