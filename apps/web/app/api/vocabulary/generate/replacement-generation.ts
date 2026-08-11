import type {
  LocalVocabularyGenerationOptions,
  LocalVocabularyRequest,
  LocalVocabularySet,
} from "@vocabulary/ai";
import { evaluateSetQuality } from "@vocabulary/domain-vocabulary";
import {
  normalizeVocabularyGenerationMetricFields,
  type VocabularyGenerationMetricFields,
  type VocabularyGenerationOutcome,
  type VocabularyGenerationStage,
} from "@vocabulary/observability";
import type { EnrichedCandidate, EnrichedVocabularySet } from "./lexical-enrichment";

const DEFAULT_MAX_ATTEMPTS = 3;

export interface DeficitReplacementDependencies {
  readonly suggest: (
    request: LocalVocabularyRequest,
    options: Required<LocalVocabularyGenerationOptions>,
  ) => Promise<LocalVocabularySet>;
  readonly enrich: (value: LocalVocabularySet) => Promise<EnrichedVocabularySet>;
  readonly maxAttempts?: number;
  readonly now?: () => number;
  readonly recordMetric?: (metric: VocabularyGenerationMetricFields) => void;
}

interface MetricInput {
  readonly stage: VocabularyGenerationStage;
  readonly outcome: VocabularyGenerationOutcome;
  readonly startedAt: number;
  readonly requestedCount: number;
  readonly deliveredCount: number;
  readonly rejectedCount: number;
  readonly attemptCount: number;
}

function normalizedTerm(term: string): string {
  return term.normalize("NFKC").toLocaleLowerCase("en-US").trim();
}

function partialMessage(delivered: number, requested: number): string {
  return `We found ${String(delivered)} of ${String(requested)} verified vocabulary candidates. Try a broader topic or a smaller set.`;
}

export async function generateWithDeficitReplacement(
  request: LocalVocabularyRequest,
  dependencies: DeficitReplacementDependencies,
): Promise<EnrichedVocabularySet> {
  const now = dependencies.now ?? (() => performance.now());
  const totalStartedAt = now();
  const record = (input: MetricInput): void => {
    dependencies.recordMetric?.(
      normalizeVocabularyGenerationMetricFields({
        stage: input.stage,
        outcome: input.outcome,
        durationMs: now() - input.startedAt,
        requestedCount: input.requestedCount,
        deliveredCount: input.deliveredCount,
        rejectedCount: input.rejectedCount,
        attemptCount: input.attemptCount,
        cacheHit: false,
      }),
    );
  };
  const maxAttempts = Math.max(1, Math.trunc(dependencies.maxAttempts ?? DEFAULT_MAX_ATTEMPTS));
  const seenTerms = new Set<string>();
  const usableByTerm = new Map<string, EnrichedCandidate>();
  const qualityReports: EnrichedCandidate["qualityReport"][] = [];
  const rejectedCandidates: EnrichedVocabularySet["rejectedCandidates"][number][] = [];
  let attempts = 0;
  let title = `${request.topic} vocabulary`;
  let strategies: Pick<EnrichedVocabularySet, "candidateStrategy" | "rankingStrategy"> = {
    candidateStrategy: "suggest-verify-select",
    rankingStrategy: "deterministic-weighted-ranking",
  };

  while (usableByTerm.size < request.requestedCount && attempts < maxAttempts) {
    const deficit = request.requestedCount - usableByTerm.size;
    const excludedTerms = [...seenTerms].sort();
    const attemptNumber = attempts + 1;
    const suggestionStartedAt = now();
    const suggested = await dependencies.suggest(
      { ...request, requestedCount: deficit },
      { excludedTerms },
    );
    attempts += 1;
    record({
      stage: "candidate-suggestion",
      outcome: "succeeded",
      startedAt: suggestionStartedAt,
      requestedCount: deficit,
      deliveredCount: suggested.candidates.length,
      rejectedCount: 0,
      attemptCount: attemptNumber,
    });
    if (attempts === 1) title = suggested.title;

    const freshCandidates = suggested.candidates.filter((candidate) => {
      const term = normalizedTerm(candidate.term);
      if (!term || seenTerms.has(term)) return false;
      seenTerms.add(term);
      return true;
    });
    if (freshCandidates.length === 0) continue;

    const enrichmentStartedAt = now();
    const enriched = await dependencies.enrich({ ...suggested, candidates: freshCandidates });
    record({
      stage: "enrichment",
      outcome: "succeeded",
      startedAt: enrichmentStartedAt,
      requestedCount: freshCandidates.length,
      deliveredCount: enriched.candidates.filter(
        ({ qualityReport }) => qualityReport.decision !== "reject",
      ).length,
      rejectedCount: enriched.candidates.filter(
        ({ qualityReport }) => qualityReport.decision === "reject",
      ).length,
      attemptCount: attemptNumber,
    });
    strategies = {
      candidateStrategy: enriched.candidateStrategy,
      rankingStrategy: enriched.rankingStrategy,
    };
    rejectedCandidates.push(...enriched.rejectedCandidates);
    for (const candidate of enriched.candidates) {
      qualityReports.push(candidate.qualityReport);
      const term = normalizedTerm(candidate.term);
      if (candidate.qualityReport.decision === "reject") {
        rejectedCandidates.push({
          term: candidate.term,
          normalizedLemma: candidate.normalizedLemma,
          reason: candidate.qualityReport.reasonCodes.join(","),
        });
      } else if (!usableByTerm.has(term)) {
        usableByTerm.set(term, candidate);
      }
    }
  }

  const candidates = [...usableByTerm.values()]
    .sort(
      (left, right) =>
        right.rankingScore - left.rankingScore ||
        left.normalizedLemma.localeCompare(right.normalizedLemma, "en"),
    )
    .slice(0, request.requestedCount)
    .map((candidate, index) => ({ ...candidate, rank: index + 1 }));
  const qualitySummary = evaluateSetQuality({
    requestedCount: request.requestedCount,
    candidates: qualityReports,
  });
  const deficitCount = request.requestedCount - candidates.length;

  record({
    stage: "replacement",
    outcome: deficitCount === 0 ? "exact" : "partial",
    startedAt: totalStartedAt,
    requestedCount: request.requestedCount,
    deliveredCount: candidates.length,
    rejectedCount: rejectedCandidates.length,
    attemptCount: attempts,
  });

  return {
    title,
    candidates,
    ...strategies,
    qualitySummary: { ...qualitySummary, usableCount: candidates.length, deficitCount },
    rejectedCandidates,
    generationFulfillment: {
      status: deficitCount === 0 ? "exact" : "partial",
      requestedCount: request.requestedCount,
      deliveredCount: candidates.length,
      deficitCount,
      attempts,
      ...(deficitCount > 0
        ? { message: partialMessage(candidates.length, request.requestedCount) }
        : {}),
    },
  };
}
