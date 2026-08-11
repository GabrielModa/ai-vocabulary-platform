import type {
  LocalVocabularyGenerationOptions,
  LocalVocabularyRequest,
  LocalVocabularySet,
} from "@vocabulary/ai";
import { evaluateSetQuality } from "@vocabulary/domain-vocabulary";
import type { EnrichedCandidate, EnrichedVocabularySet } from "./lexical-enrichment";

const DEFAULT_MAX_ATTEMPTS = 3;

export interface DeficitReplacementDependencies {
  readonly suggest: (
    request: LocalVocabularyRequest,
    options: Required<LocalVocabularyGenerationOptions>,
  ) => Promise<LocalVocabularySet>;
  readonly enrich: (value: LocalVocabularySet) => Promise<EnrichedVocabularySet>;
  readonly maxAttempts?: number;
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
    const suggested = await dependencies.suggest(
      { ...request, requestedCount: deficit },
      { excludedTerms },
    );
    attempts += 1;
    if (attempts === 1) title = suggested.title;

    const freshCandidates = suggested.candidates.filter((candidate) => {
      const term = normalizedTerm(candidate.term);
      if (!term || seenTerms.has(term)) return false;
      seenTerms.add(term);
      return true;
    });
    if (freshCandidates.length === 0) continue;

    const enriched = await dependencies.enrich({ ...suggested, candidates: freshCandidates });
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
