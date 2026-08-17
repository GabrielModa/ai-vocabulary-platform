import type { EnrichedCandidate, GenerationFulfillment } from "./lexical-enrichment";

export type LearningSetReadinessStatus = "ready" | "partial" | "blocked";

export interface LearningSetReadinessReport {
  readonly status: LearningSetReadinessStatus;
  readonly score: number;
  readonly requestedCount: number;
  readonly deliveredCount: number;
  readonly verifiedLexicalCount: number;
  readonly contextualExampleCount: number;
  readonly verifiedExampleCount: number;
  readonly provisionalExampleCount: number;
  readonly clozeReadyCount: number;
  readonly definitionReadyCount: number;
  readonly sessionReadyCount: number;
  readonly deficitCount: number;
  readonly reasonCodes: readonly string[];
  readonly recommendations: readonly string[];
}

const MINIMUM_SESSION_SIZE = 4;
const PENDING_EXAMPLE = "A verified example is not available yet.";

function percentage(value: number, total: number): number {
  return total === 0 ? 0 : Math.round((Math.min(value, total) / total) * 100);
}

export function evaluateLearningSetReadiness(input: {
  readonly candidates: readonly EnrichedCandidate[];
  readonly fulfillment: GenerationFulfillment;
  readonly publishableCandidateIds?: ReadonlySet<string>;
}): LearningSetReadinessReport {
  const requestedCount = input.fulfillment.requestedCount;
  const deliveredCount = input.candidates.length;
  const verified = input.candidates.filter(
    (candidate) => candidate.lexicalValidationStatus === "verified" && Boolean(candidate.senseId),
  );
  const verifiedLexicalCount = verified.length;
  const contextualExampleCount = verified.filter(
    (candidate) => candidate.example.trim() !== PENDING_EXAMPLE,
  ).length;
  const verifiedExampleCount = verified.filter(
    (candidate) => (candidate.verifiedExamples?.length ?? 0) > 0,
  ).length;
  const provisionalExampleCount = verified.filter(
    (candidate) => candidate.exampleProvenance?.validationStatus === "provisional",
  ).length;
  const clozeReadyCount = verified.filter(
    (candidate) => candidate.exercisePipelineOutcome?.outcome === "publish",
  ).length;
  const definitionReadyCount = verified.filter(
    (candidate) => candidate.meaning.trim().length > 0,
  ).length;
  const definitionPoolReady = definitionReadyCount >= MINIMUM_SESSION_SIZE;
  const sessionReadyCount = input.publishableCandidateIds
    ? verified.filter(({ candidateId }) => input.publishableCandidateIds?.has(candidateId)).length
    : definitionPoolReady
      ? definitionReadyCount
      : Math.min(clozeReadyCount, verifiedLexicalCount);
  const deficitCount = Math.max(0, requestedCount - sessionReadyCount);

  const lexicalCoverage = percentage(verifiedLexicalCount, requestedCount);
  const exampleCoverage = percentage(contextualExampleCount, requestedCount);
  const exerciseCoverage = percentage(sessionReadyCount, requestedCount);
  const fulfillmentCoverage = percentage(deliveredCount, requestedCount);
  const score = Math.round(
    lexicalCoverage * 0.35 +
      exampleCoverage * 0.2 +
      exerciseCoverage * 0.3 +
      fulfillmentCoverage * 0.15,
  );
  const status: LearningSetReadinessStatus =
    sessionReadyCount < MINIMUM_SESSION_SIZE ? "blocked" : deficitCount === 0 ? "ready" : "partial";
  const reasonCodes = [
    ...(deliveredCount < requestedCount ? ["requested-count-shortfall"] : []),
    ...(verifiedLexicalCount < deliveredCount ? ["lexical-verification-gap"] : []),
    ...(contextualExampleCount < verifiedLexicalCount ? ["example-coverage-gap"] : []),
    ...(provisionalExampleCount > 0 ? ["provisional-examples-present"] : []),
    ...(sessionReadyCount < MINIMUM_SESSION_SIZE ? ["insufficient-publishable-exercises"] : []),
  ];
  const recommendations = [
    ...(status === "blocked"
      ? ["Generate or select at least four words with verified meanings before training."]
      : []),
    ...(deliveredCount < requestedCount
      ? ["Continue with the usable set or request fewer words from a broader topic."]
      : []),
    ...(contextualExampleCount < verifiedLexicalCount
      ? ["Study meanings now; missing contextual examples can be regenerated independently."]
      : []),
    ...(provisionalExampleCount > 0
      ? ["Generated examples are provisional and remain separate from verified lexical facts."]
      : []),
  ];

  return Object.freeze({
    status,
    score,
    requestedCount,
    deliveredCount,
    verifiedLexicalCount,
    contextualExampleCount,
    verifiedExampleCount,
    provisionalExampleCount,
    clozeReadyCount,
    definitionReadyCount,
    sessionReadyCount,
    deficitCount,
    reasonCodes: Object.freeze(reasonCodes),
    recommendations: Object.freeze(recommendations),
  });
}
