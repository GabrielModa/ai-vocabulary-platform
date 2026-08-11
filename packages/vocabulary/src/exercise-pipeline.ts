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
import {
  screenExerciseSemanticUniqueness,
  type SemanticUniquenessIssue,
  type SemanticUniquenessStatus,
} from "./semantic-uniqueness.js";

export interface PublishExerciseOutcome {
  readonly outcome: "publish";
  readonly pipeline: "verified-exercise-pipeline-v1";
  readonly exercise: VerifiedExercise;
  readonly semanticUniqueness: "evidence-screened";
}

export interface RequestAiFallbackOutcome {
  readonly outcome: "request-ai-fallback";
  readonly pipeline: "verified-exercise-pipeline-v1";
  readonly exercise: VerifiedExercise;
  readonly request: AiFallbackRequest;
  readonly readinessIssues: readonly PedagogicalReadinessIssue[];
  readonly semanticUniqueness: "evidence-screened";
}

export interface RejectExerciseOutcome {
  readonly outcome: "reject";
  readonly pipeline: "verified-exercise-pipeline-v1";
  readonly stage: "composition" | "structural-policy" | "semantic-policy";
  readonly compositionFailure?: ExerciseCompositionFailure;
  readonly structuralReasons: readonly ExerciseValidationReason[];
  readonly semanticUniqueness: SemanticUniquenessStatus;
  readonly semanticIssues?: readonly SemanticUniquenessIssue[];
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

  const selectedDistractorIds = new Set(composition.distractorCandidateIds);
  const semanticScreen = screenExerciseSemanticUniqueness({
    exercise: composition,
    answer: input.answer.candidate,
    distractors: input.distractorPool
      .filter(({ candidate }) => selectedDistractorIds.has(candidate.candidateId))
      .map(({ candidate }) => candidate),
  });
  if (semanticScreen.status === "failed-screening") {
    return Object.freeze({
      outcome: "reject",
      pipeline: "verified-exercise-pipeline-v1",
      stage: "semantic-policy",
      structuralReasons: Object.freeze([]),
      semanticUniqueness: semanticScreen.status,
      semanticIssues: semanticScreen.issues,
    });
  }

  const readiness = evaluatePedagogicalReadiness(composition);
  const fallbackDecision = decideAiFallback(readiness);

  if (fallbackDecision.decision === "not-required") {
    return Object.freeze({
      outcome: "publish",
      pipeline: "verified-exercise-pipeline-v1",
      exercise: composition,
      semanticUniqueness: semanticScreen.status,
    });
  }

  if (fallbackDecision.decision === "allowed") {
    return Object.freeze({
      outcome: "request-ai-fallback",
      pipeline: "verified-exercise-pipeline-v1",
      exercise: composition,
      request: fallbackDecision.request,
      readinessIssues: readiness.ready ? Object.freeze([]) : readiness.issues,
      semanticUniqueness: semanticScreen.status,
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
