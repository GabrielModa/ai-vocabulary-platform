import type { LearningCandidate } from "./candidate-pipeline.js";
import type { FrequencyContent } from "./frequency.js";
import {
  createWordKnowledge,
  type ContextualSenseDecision,
  type ExerciseCapability,
  type WordKnowledge,
  type WordKnowledgeContext,
} from "./lexical-knowledge.js";
import type { CefrClassification, ExampleContent, PronunciationContent } from "./providers.js";

export interface ResolveCandidateKnowledgeEvidence {
  readonly examplesBySenseId?: Readonly<Record<string, readonly ExampleContent[]>>;
  readonly pronunciations?: readonly PronunciationContent[];
  readonly cefrClassifications?: readonly CefrClassification[];
  readonly frequency?: FrequencyContent;
}

export interface ResolveCandidateKnowledgeInput {
  readonly candidate: LearningCandidate;
  readonly context: WordKnowledgeContext;
  readonly evidence?: ResolveCandidateKnowledgeEvidence;
  readonly exerciseCapabilities?: readonly ExerciseCapability[];
}

export type ResolveCandidateKnowledgeResult =
  | {
      readonly ok: true;
      readonly status: "resolved";
      readonly knowledge: WordKnowledge;
    }
  | {
      readonly ok: true;
      readonly status: "needs-review";
      readonly candidateId: string;
      readonly availableSenseIds: readonly string[];
    }
  | {
      readonly ok: false;
      readonly code: "invalid-resolved-candidate";
      readonly message: string;
    };

function decisionFor(candidate: LearningCandidate): ContextualSenseDecision | undefined {
  const selected = candidate.selectedSense;
  if (!selected) return undefined;

  if (selected.confirmedBy === "learner-selection") {
    return Object.freeze({
      selectedSenseId: selected.senseId,
      resolution: "learner-confirmed",
      confidence: 1,
      reasonCodes: Object.freeze(["learner-confirmed-sense", "verified-lexical-source"]),
      decidedBy: "learner",
    });
  }

  return Object.freeze({
    selectedSenseId: selected.senseId,
    resolution: "auto-selected",
    confidence: 1,
    reasonCodes: Object.freeze(["single-selectable-sense", "verified-lexical-source"]),
    decidedBy: "single-verified-sense",
  });
}

export function resolveCandidateKnowledge(
  input: ResolveCandidateKnowledgeInput,
): ResolveCandidateKnowledgeResult {
  const decision = decisionFor(input.candidate);
  if (!decision) {
    return Object.freeze({
      ok: true,
      status: "needs-review",
      candidateId: input.candidate.candidateId,
      availableSenseIds: Object.freeze(
        input.candidate.availableSenses
          .filter(({ definition }) => Boolean(definition))
          .map(({ senseId }) => senseId),
      ),
    });
  }

  const selected = input.candidate.selectedSense;
  if (!selected) {
    return Object.freeze({
      ok: false,
      code: "invalid-resolved-candidate",
      message: "Resolved candidates must include a selected lexical sense",
    });
  }

  const result = createWordKnowledge({
    candidateId: input.candidate.candidateId,
    displayForm: input.candidate.displayForm,
    normalizedLemma: input.candidate.normalizedLemma,
    context: input.context,
    decision,
    evidence: {
      lexicalSenses: input.candidate.availableSenses,
      officialExamples: Object.freeze([
        ...(input.evidence?.examplesBySenseId?.[selected.senseId] ?? []),
      ]),
      pronunciations: Object.freeze([...(input.evidence?.pronunciations ?? [])]),
      cefrClassifications: Object.freeze(
        (input.evidence?.cefrClassifications ?? []).filter(
          ({ senseId }) => senseId === selected.senseId,
        ),
      ),
      ...(input.evidence?.frequency ? { frequency: input.evidence.frequency } : {}),
    },
    ...(input.exerciseCapabilities ? { exerciseCapabilities: input.exerciseCapabilities } : {}),
  });

  if (!result.ok) {
    return Object.freeze({
      ok: false,
      code: "invalid-resolved-candidate",
      message: result.message,
    });
  }

  return Object.freeze({
    ok: true,
    status: "resolved",
    knowledge: result.knowledge,
  });
}
