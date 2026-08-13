import { suggestTrustedTopicCandidates } from "@vocabulary/domain-vocabulary";
import type { LocalVocabularyRequest, LocalVocabularySet } from "@vocabulary/ai";
import type { EnrichedCandidate, EnrichedVocabularySet } from "./lexical-enrichment";
import { enrichVocabularySet } from "./lexical-enrichment";

const PENDING_MEANING = "Meaning pending lexical verification.";
const PENDING_EXAMPLE = "A verified example is not available yet.";
const PENDING_CHALLENGE = "Confirm the intended meaning before training.";
const SUPPLEMENTAL_COUNT = 8;

export interface SupplementalDistractorLookups {
  readonly lexicalLookup: Parameters<typeof enrichVocabularySet>[1];
  readonly frequencyLookup: Parameters<typeof enrichVocabularySet>[2];
  readonly exampleLookup: Parameters<typeof enrichVocabularySet>[3];
  readonly pronunciationLookup: Parameters<typeof enrichVocabularySet>[4];
}

function asVocabularySet(
  title: string,
  candidates: NonNullable<ReturnType<typeof suggestTrustedTopicCandidates>>["candidates"],
): LocalVocabularySet {
  return {
    title,
    candidates: candidates.map(({ term, partOfSpeech }) => ({
      term,
      type: partOfSpeech,
      meaning: PENDING_MEANING,
      example: PENDING_EXAMPLE,
      challenge: PENDING_CHALLENGE,
    })),
  };
}

export async function generateTrustedSupplementalDistractors(
  request: LocalVocabularyRequest,
  generated: EnrichedVocabularySet,
  lookups: SupplementalDistractorLookups,
): Promise<readonly EnrichedCandidate[]> {
  const trusted = suggestTrustedTopicCandidates({
    topic: request.topic,
    level: request.level,
    count: SUPPLEMENTAL_COUNT,
    excludedTerms: generated.candidates.map(({ normalizedLemma }) => normalizedLemma),
  });

  if (!trusted || trusted.candidates.length === 0) return [];

  const enriched = await enrichVocabularySet(
    asVocabularySet(`${generated.title} distractor reserve`, trusted.candidates),
    lookups.lexicalLookup,
    lookups.frequencyLookup,
    lookups.exampleLookup,
    lookups.pronunciationLookup,
    { topic: request.topic, level: request.level },
  );

  return Object.freeze(
    enriched.candidates.filter(
      ({ lexicalValidationStatus }) => lexicalValidationStatus === "verified",
    ),
  );
}
