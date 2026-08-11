import type {
  LocalVocabularyGenerationOptions,
  LocalVocabularyRequest,
  LocalVocabularySet,
} from "@vocabulary/ai";
import { suggestTrustedTopicCandidates } from "@vocabulary/domain-vocabulary";

const PENDING_MEANING = "Meaning pending lexical verification.";
const PENDING_EXAMPLE = "A verified example is not available yet.";
const PENDING_CHALLENGE = "Confirm the intended meaning before training.";

export type AiCandidateSuggestion = (
  request: LocalVocabularyRequest,
  options: Required<LocalVocabularyGenerationOptions>,
) => Promise<LocalVocabularySet>;

export async function suggestCandidatesWithTrustedFirst(
  request: LocalVocabularyRequest,
  options: Required<LocalVocabularyGenerationOptions>,
  suggestWithAi: AiCandidateSuggestion,
): Promise<LocalVocabularySet> {
  const trusted = suggestTrustedTopicCandidates({
    topic: request.topic,
    level: request.level,
    count: request.requestedCount,
    excludedTerms: options.excludedTerms,
  });

  if (!trusted || trusted.candidates.length === 0) {
    return suggestWithAi(request, options);
  }

  return {
    title: `${trusted.resolvedTopic[0]?.toUpperCase() ?? ""}${trusted.resolvedTopic.slice(1)} vocabulary`,
    candidates: trusted.candidates.map(({ term, partOfSpeech }) => ({
      term,
      type: partOfSpeech,
      meaning: PENDING_MEANING,
      example: PENDING_EXAMPLE,
      challenge: PENDING_CHALLENGE,
    })),
  };
}
