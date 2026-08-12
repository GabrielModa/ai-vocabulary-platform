import type { LocalExampleRequest, LocalExampleSuggestion } from "@vocabulary/ai";
import type { EnrichedCandidate, EnrichedVocabularySet } from "./lexical-enrichment";

const PENDING_EXAMPLE = "A verified example is not available yet.";

export interface GeneratedExampleEnrichmentOptions {
  readonly topic: string;
  readonly level: LocalExampleRequest["level"];
  readonly generate: (request: LocalExampleRequest) => Promise<readonly LocalExampleSuggestion[]>;
  readonly now?: () => Date;
}

function canGenerate(candidate: EnrichedCandidate): candidate is EnrichedCandidate & {
  readonly senseId: string;
} {
  return (
    candidate.lexicalValidationStatus === "verified" &&
    Boolean(candidate.senseId) &&
    candidate.verifiedExamples === undefined &&
    candidate.example === PENDING_EXAMPLE
  );
}

export async function enrichMissingStudyExamples(
  vocabularySet: EnrichedVocabularySet,
  options: GeneratedExampleEnrichmentOptions,
): Promise<EnrichedVocabularySet> {
  const missing = vocabularySet.candidates.filter(canGenerate).slice(0, 20);
  if (missing.length === 0) return vocabularySet;

  let suggestions: readonly LocalExampleSuggestion[];
  try {
    suggestions = await options.generate({
      topic: options.topic,
      level: options.level,
      candidates: missing.map((candidate) => ({
        candidateId: candidate.candidateId,
        term: candidate.term,
        partOfSpeech: candidate.type,
        senseId: candidate.senseId,
        definition: candidate.meaning,
      })),
    });
  } catch {
    return vocabularySet;
  }

  const suggestionById = new Map(
    suggestions.map((suggestion) => [suggestion.candidateId, suggestion]),
  );
  const generatedAt = (options.now ?? (() => new Date()))().toISOString();
  return {
    ...vocabularySet,
    candidates: vocabularySet.candidates.map((candidate) => {
      if (!canGenerate(candidate)) return candidate;
      const suggestion = suggestionById.get(candidate.candidateId);
      if (!suggestion) return candidate;
      return {
        ...candidate,
        example: suggestion.sentence,
        contexts: [suggestion.sentence],
        exampleProvenance: {
          provider: "ollama-local",
          sourceId: `${candidate.candidateId}:${candidate.senseId}`,
          retrievedAt: generatedAt,
          generated: true,
          validationStatus: "provisional",
        },
      };
    }),
  };
}
