import {
  resolveCandidateContextually,
  type ContextualSenseDecision,
  type ContextualSenseSelectorPort,
  type LearningCandidate,
} from "@vocabulary/domain-vocabulary";
import { definitionRecallChallenge } from "../../../sense-bound-exercise";
import type { EnrichedCandidate, EnrichedVocabularySet } from "./lexical-enrichment";

export interface ContextualEnrichmentOptions {
  readonly selector: ContextualSenseSelectorPort;
  readonly context: {
    readonly topic: string;
    readonly learnerLevel: string;
    readonly locale: string;
  };
}

export type ContextuallyResolvedCandidate = EnrichedCandidate & {
  readonly senseSelectionConfidence?: number;
  readonly senseSelectionReasonCodes?: readonly string[];
  readonly senseSelectedBy?: "single-verified-sense" | "contextual-ai-selector" | "learner";
};

export interface ContextuallyResolvedVocabularySet extends Omit<
  EnrichedVocabularySet,
  "candidates"
> {
  readonly candidates: readonly ContextuallyResolvedCandidate[];
}

function learningCandidate(candidate: EnrichedCandidate): LearningCandidate {
  return {
    candidateId: candidate.candidateId,
    displayForm: candidate.term,
    normalizedLemma: candidate.normalizedLemma,
    proposedPartOfSpeech: candidate.type,
    lexicalStatus:
      candidate.lexicalValidationStatus === "unavailable"
        ? "unavailable"
        : candidate.senseId
          ? "verified"
          : "ambiguous",
    ...(candidate.senseId && candidate.lexicalProvenance
      ? {
          selectedSense: {
            senseId: candidate.senseId,
            definition: candidate.meaning,
            partOfSpeech: candidate.type,
            provenance: candidate.lexicalProvenance,
            confirmedBy: "unique-provider-match",
          },
        }
      : {}),
    availableSenses: candidate.lexicalSenses ?? [],
    selectionReasons: candidate.selectionReasons,
  };
}

function withDecision(
  candidate: EnrichedCandidate,
  resolved: LearningCandidate,
  decision: ContextualSenseDecision,
): ContextuallyResolvedCandidate {
  const selected = resolved.selectedSense;
  if (!selected) return candidate;

  return {
    ...candidate,
    meaning: selected.definition,
    challenge: definitionRecallChallenge(selected.definition),
    exerciseKind: "definition-choice",
    lexicalValidationStatus: "verified",
    senseId: selected.senseId,
    lexicalProvenance: selected.provenance,
    senseSelectionConfidence: decision.confidence,
    senseSelectionReasonCodes: decision.reasonCodes,
    senseSelectedBy: decision.decidedBy,
  };
}

async function resolveCandidate(
  candidate: EnrichedCandidate,
  options: ContextualEnrichmentOptions,
): Promise<ContextuallyResolvedCandidate> {
  if (candidate.lexicalValidationStatus === "unavailable" || candidate.senseId) {
    return candidate;
  }

  const result = await resolveCandidateContextually({
    candidate: learningCandidate(candidate),
    context: options.context,
    selector: options.selector,
  });

  if (!result.ok || result.status !== "resolved") {
    return candidate;
  }

  return withDecision(candidate, result.candidate, result.decision);
}

export async function resolveVocabularySetContextually(
  vocabularySet: EnrichedVocabularySet,
  options: ContextualEnrichmentOptions,
): Promise<ContextuallyResolvedVocabularySet> {
  return {
    ...vocabularySet,
    candidates: Object.freeze(
      await Promise.all(
        vocabularySet.candidates.map((candidate) => resolveCandidate(candidate, options)),
      ),
    ),
  };
}
