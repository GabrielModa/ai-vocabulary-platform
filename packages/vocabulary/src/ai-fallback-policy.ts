import type { ExerciseValidationReason } from "./exercise-validator.js";
import type {
  NeedsFallbackResult,
  PedagogicalFallbackReason,
  PedagogicalReadinessResult,
} from "./pedagogical-readiness.js";

export type AiFallbackDecision = "not-required" | "allowed" | "prohibited";

export type AiFallbackOperation = "rewrite-context-only";

export interface AiFallbackConstraint {
  readonly code:
    | "preserve-answer"
    | "preserve-sense"
    | "preserve-options"
    | "preserve-provenance"
    | "one-gap"
    | "no-visible-options"
    | "minimum-context";
  readonly value?: string | number;
}

export interface AiFallbackRequest {
  readonly requestId: string;
  readonly operation: AiFallbackOperation;
  readonly exerciseId: string;
  readonly candidateId: string;
  readonly senseId: string;
  readonly answer: string;
  readonly currentSourceSentence: string;
  readonly currentGapSentence: string;
  readonly options: readonly string[];
  readonly triggeringReasons: readonly PedagogicalFallbackReason[];
  readonly constraints: readonly AiFallbackConstraint[];
  readonly outputContract: {
    readonly sourceSentence: "string";
    readonly gapSentence: "string";
  };
}

export interface AiFallbackNotRequired {
  readonly decision: "not-required";
  readonly policy: "ai-fallback-policy-v1";
  readonly reason: "exercise-already-ready";
}

export interface AiFallbackAllowed {
  readonly decision: "allowed";
  readonly policy: "ai-fallback-policy-v1";
  readonly operation: AiFallbackOperation;
  readonly request: AiFallbackRequest;
}

export interface AiFallbackProhibited {
  readonly decision: "prohibited";
  readonly policy: "ai-fallback-policy-v1";
  readonly reason: "structural-repair-required";
  readonly structuralReasons: readonly ExerciseValidationReason[];
}

export type AiFallbackPolicyResult =
  AiFallbackNotRequired | AiFallbackAllowed | AiFallbackProhibited;

const CONTEXT_REPAIRABLE_REASONS = new Set<PedagogicalFallbackReason>([
  "context-too-short",
  "answer-dominates-context",
  "option-visible-outside-gap",
]);

function normalizedReasonList(result: NeedsFallbackResult): readonly PedagogicalFallbackReason[] {
  return Object.freeze(
    [...new Set(result.issues.map((entry) => entry.reason))].sort((left, right) =>
      left.localeCompare(right, "en-US"),
    ),
  );
}

function fallbackRequestId(
  exerciseId: string,
  reasons: readonly PedagogicalFallbackReason[],
): string {
  return [
    "ai-fallback",
    encodeURIComponent(exerciseId),
    encodeURIComponent(reasons.join(",")),
    "rewrite-context",
    "v1",
  ].join(":");
}

function buildRequest(result: NeedsFallbackResult): AiFallbackRequest {
  const reasons = normalizedReasonList(result);

  return Object.freeze({
    requestId: fallbackRequestId(result.exercise.exerciseId, reasons),
    operation: "rewrite-context-only",
    exerciseId: result.exercise.exerciseId,
    candidateId: result.exercise.candidateId,
    senseId: result.exercise.senseId,
    answer: result.exercise.answer,
    currentSourceSentence: result.exercise.sourceSentence,
    currentGapSentence: result.exercise.gapSentence,
    options: Object.freeze([...result.exercise.options]),
    triggeringReasons: reasons,
    constraints: Object.freeze([
      Object.freeze({ code: "preserve-answer" }),
      Object.freeze({ code: "preserve-sense" }),
      Object.freeze({ code: "preserve-options" }),
      Object.freeze({ code: "preserve-provenance" }),
      Object.freeze({ code: "one-gap", value: 1 }),
      Object.freeze({ code: "no-visible-options" }),
      Object.freeze({ code: "minimum-context", value: 3 }),
    ]),
    outputContract: Object.freeze({
      sourceSentence: "string",
      gapSentence: "string",
    }),
  });
}

export function decideAiFallback(readiness: PedagogicalReadinessResult): AiFallbackPolicyResult {
  if (readiness.ready) {
    return Object.freeze({
      decision: "not-required",
      policy: "ai-fallback-policy-v1",
      reason: "exercise-already-ready",
    });
  }

  if (readiness.structuralIssues.length > 0) {
    return Object.freeze({
      decision: "prohibited",
      policy: "ai-fallback-policy-v1",
      reason: "structural-repair-required",
      structuralReasons: Object.freeze(
        [...new Set(readiness.structuralIssues.map((entry) => entry.reason))].sort((left, right) =>
          left.localeCompare(right, "en-US"),
        ),
      ),
    });
  }

  const reasons = normalizedReasonList(readiness);
  const allReasonsAreContextRepairable = reasons.every((reason) =>
    CONTEXT_REPAIRABLE_REASONS.has(reason),
  );

  if (!allReasonsAreContextRepairable || reasons.length === 0) {
    return Object.freeze({
      decision: "prohibited",
      policy: "ai-fallback-policy-v1",
      reason: "structural-repair-required",
      structuralReasons: Object.freeze([]),
    });
  }

  return Object.freeze({
    decision: "allowed",
    policy: "ai-fallback-policy-v1",
    operation: "rewrite-context-only",
    request: buildRequest(readiness),
  });
}
