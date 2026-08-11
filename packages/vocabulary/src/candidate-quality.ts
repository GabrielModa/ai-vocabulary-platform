import type { LearningCandidate } from "./candidate-pipeline.js";

export type CandidateQualityDecision = "accept" | "review" | "reject";
export type ExerciseReadinessStatus = "ready" | "requires-review" | "unavailable";

export interface CandidateQualityDimensions {
  readonly lexicalCoverage: number;
  readonly exerciseReadiness: number;
  readonly exampleCoverage: number;
  readonly frequencyEvidence: number;
  readonly ambiguityRisk: number;
}

export interface CandidateQualityReport {
  readonly candidateId: string;
  readonly decision: CandidateQualityDecision;
  readonly exerciseReadiness: ExerciseReadinessStatus;
  readonly overallScore: number;
  readonly dimensions: CandidateQualityDimensions;
  readonly reasonCodes: readonly string[];
}

export interface EvaluateCandidateQualityInput {
  readonly candidate: LearningCandidate;
  readonly verifiedExampleCount: number;
  readonly hasFrequencyEvidence: boolean;
}

export interface SetQualityReport {
  readonly requestedCount: number;
  readonly evaluatedCount: number;
  readonly acceptedCount: number;
  readonly reviewCount: number;
  readonly rejectedCount: number;
  readonly usableCount: number;
  readonly deficitCount: number;
  readonly coveragePercentage: number;
  readonly averageScore: number;
  readonly qualityBand: "high" | "medium" | "low";
}

function exampleCoverage(count: number): number {
  if (count >= 3) return 100;
  if (count === 2) return 80;
  if (count === 1) return 60;
  return 0;
}

function selectableDefinitionCount(candidate: LearningCandidate): number {
  return candidate.availableSenses.filter(
    (sense) =>
      Boolean(sense.definition) &&
      (!candidate.proposedPartOfSpeech || sense.partOfSpeech === candidate.proposedPartOfSpeech),
  ).length;
}

export function evaluateCandidateQuality(
  input: EvaluateCandidateQualityInput,
): CandidateQualityReport {
  const candidate = input.candidate;
  const examples = Math.max(0, Math.trunc(input.verifiedExampleCount));
  const selectableDefinitions = selectableDefinitionCount(candidate);

  if (candidate.lexicalStatus === "unavailable" || selectableDefinitions === 0) {
    return Object.freeze({
      candidateId: candidate.candidateId,
      decision: "reject",
      exerciseReadiness: "unavailable",
      overallScore: 0,
      dimensions: Object.freeze({
        lexicalCoverage: 0,
        exerciseReadiness: 0,
        exampleCoverage: 0,
        frequencyEvidence: 0,
        ambiguityRisk: 100,
      }),
      reasonCodes: Object.freeze(["lexical-evidence-unavailable", "exercise-unavailable"]),
    });
  }

  const verified = candidate.selectedSense !== undefined && candidate.lexicalStatus === "verified";
  const dimensions: CandidateQualityDimensions = Object.freeze({
    lexicalCoverage: verified ? 100 : 70,
    exerciseReadiness: verified ? (examples > 0 ? 100 : 70) : 40,
    exampleCoverage: exampleCoverage(examples),
    frequencyEvidence: input.hasFrequencyEvidence ? 100 : 0,
    ambiguityRisk: verified ? 0 : 60,
  });
  const overallScore = Math.round(
    dimensions.lexicalCoverage * 0.35 +
      dimensions.exerciseReadiness * 0.3 +
      dimensions.exampleCoverage * 0.15 +
      dimensions.frequencyEvidence * 0.1 +
      (100 - dimensions.ambiguityRisk) * 0.1,
  );

  return Object.freeze({
    candidateId: candidate.candidateId,
    decision: verified ? "accept" : "review",
    exerciseReadiness: verified ? "ready" : "requires-review",
    overallScore,
    dimensions,
    reasonCodes: Object.freeze(
      verified
        ? [
            "verified-sense",
            "definition-exercise-ready",
            ...(examples > 0 ? ["verified-examples"] : []),
          ]
        : ["verified-senses-ambiguous", "sense-confirmation-required"],
    ),
  });
}

export function evaluateSetQuality(input: {
  readonly requestedCount: number;
  readonly candidates: readonly CandidateQualityReport[];
}): SetQualityReport {
  if (!Number.isSafeInteger(input.requestedCount) || input.requestedCount < 1) {
    throw new Error("Requested count must be a positive safe integer");
  }

  const acceptedCount = input.candidates.filter(({ decision }) => decision === "accept").length;
  const reviewCount = input.candidates.filter(({ decision }) => decision === "review").length;
  const rejectedCount = input.candidates.filter(({ decision }) => decision === "reject").length;
  const usableCount = acceptedCount + reviewCount;
  const deficitCount = Math.max(0, input.requestedCount - usableCount);
  const coveragePercentage = Math.round(
    (Math.min(input.requestedCount, usableCount) / input.requestedCount) * 100,
  );
  const averageScore =
    input.candidates.length === 0
      ? 0
      : Math.round(
          input.candidates.reduce((total, candidate) => total + candidate.overallScore, 0) /
            input.candidates.length,
        );

  return Object.freeze({
    requestedCount: input.requestedCount,
    evaluatedCount: input.candidates.length,
    acceptedCount,
    reviewCount,
    rejectedCount,
    usableCount,
    deficitCount,
    coveragePercentage,
    averageScore,
    qualityBand: averageScore >= 80 ? "high" : averageScore >= 60 ? "medium" : "low",
  });
}
