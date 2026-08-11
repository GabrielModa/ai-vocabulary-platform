export const vocabularyGenerationStages = [
  "total",
  "candidate-suggestion",
  "lexical-lookups",
  "enrichment",
  "replacement",
  "exercise-publication",
  "draft-persistence",
] as const;

export type VocabularyGenerationStage = (typeof vocabularyGenerationStages)[number] | "unknown";

export const vocabularyGenerationOutcomes = [
  "succeeded",
  "exact",
  "partial",
  "rejected",
  "failed",
] as const;

export type VocabularyGenerationOutcome = (typeof vocabularyGenerationOutcomes)[number];

export interface VocabularyGenerationMetricInput {
  readonly stage: string;
  readonly outcome: string;
  readonly durationMs: number;
  readonly requestedCount: number;
  readonly deliveredCount: number;
  readonly rejectedCount: number;
  readonly attemptCount: number;
  readonly cacheHit: boolean;
}

export interface VocabularyGenerationMetricFields {
  readonly stage: VocabularyGenerationStage;
  readonly outcome: VocabularyGenerationOutcome;
  readonly durationMs: number;
  readonly requestedCount: number;
  readonly deliveredCount: number;
  readonly rejectedCount: number;
  readonly attemptCount: number;
  readonly cacheHit: boolean;
}

function boundedInteger(value: number, maximum: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(maximum, Math.max(0, Math.trunc(value)));
}

function normalizeStage(value: string): VocabularyGenerationStage {
  return vocabularyGenerationStages.some((candidate) => candidate === value)
    ? (value as (typeof vocabularyGenerationStages)[number])
    : "unknown";
}

function normalizeOutcome(value: string): VocabularyGenerationOutcome {
  return vocabularyGenerationOutcomes.some((candidate) => candidate === value)
    ? (value as VocabularyGenerationOutcome)
    : "failed";
}

export function normalizeVocabularyGenerationMetricFields(
  input: VocabularyGenerationMetricInput,
): VocabularyGenerationMetricFields {
  return Object.freeze({
    stage: normalizeStage(input.stage),
    outcome: normalizeOutcome(input.outcome),
    durationMs: boundedInteger(Math.round(input.durationMs), 60 * 60 * 1000),
    requestedCount: boundedInteger(input.requestedCount, 100),
    deliveredCount: boundedInteger(input.deliveredCount, 100),
    rejectedCount: boundedInteger(input.rejectedCount, 100),
    attemptCount: boundedInteger(input.attemptCount, 10),
    cacheHit: input.cacheHit,
  });
}
