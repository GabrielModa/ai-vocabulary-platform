import type { SelectedLexicalSense } from "./candidate-pipeline.js";
import type { ContentProvenance, LexicalContent } from "./content.js";
import type { CefrClassification, ExampleContent, PronunciationContent } from "./providers.js";
import type { FrequencyContent } from "./frequency.js";

export const WORD_KNOWLEDGE_VERSION = "word-knowledge-v1" as const;

export type WordKnowledgeResolution = "auto-selected" | "learner-confirmed" | "needs-review";

export type ExerciseCapability =
  | "definition-choice"
  | "word-definition-match"
  | "verified-cloze"
  | "image-recognition"
  | "audio-recognition"
  | "collocation";

export interface ContextualSenseDecision {
  readonly selectedSenseId: string;
  readonly resolution: WordKnowledgeResolution;
  readonly confidence: number;
  readonly reasonCodes: readonly string[];
  readonly decidedBy: "single-verified-sense" | "contextual-ai-selector" | "learner";
}

export interface WordKnowledgeContext {
  readonly topic: string;
  readonly learnerLevel: string;
  readonly locale: string;
}

export interface WordKnowledgeEvidence {
  readonly lexicalSenses: readonly LexicalContent[];
  readonly officialExamples: readonly ExampleContent[];
  readonly pronunciations: readonly PronunciationContent[];
  readonly cefrClassifications: readonly CefrClassification[];
  readonly frequency?: FrequencyContent;
}

export interface WordKnowledge {
  readonly version: typeof WORD_KNOWLEDGE_VERSION;
  readonly knowledgeId: string;
  readonly candidateId: string;
  readonly displayForm: string;
  readonly normalizedLemma: string;
  readonly partOfSpeech: string;
  readonly context: WordKnowledgeContext;
  readonly decision: ContextualSenseDecision;
  readonly selectedSense: SelectedLexicalSense;
  readonly alternativeSenses: readonly LexicalContent[];
  readonly evidence: WordKnowledgeEvidence;
  readonly exerciseCapabilities: readonly ExerciseCapability[];
  readonly provenance: readonly ContentProvenance[];
}

export type CreateWordKnowledgeResult =
  | { readonly ok: true; readonly knowledge: WordKnowledge }
  | {
      readonly ok: false;
      readonly code:
        | "invalid-confidence"
        | "selected-sense-not-found"
        | "selected-sense-missing-definition"
        | "part-of-speech-mismatch";
      readonly message: string;
    };

export interface CreateWordKnowledgeInput {
  readonly candidateId: string;
  readonly displayForm: string;
  readonly normalizedLemma: string;
  readonly context: WordKnowledgeContext;
  readonly decision: ContextualSenseDecision;
  readonly evidence: WordKnowledgeEvidence;
  readonly exerciseCapabilities?: readonly ExerciseCapability[];
}

function failure(
  code: Exclude<CreateWordKnowledgeResult, { readonly ok: true }>["code"],
  message: string,
): CreateWordKnowledgeResult {
  return Object.freeze({ ok: false, code, message });
}

function normalized(value: string): string {
  return value.normalize("NFKC").trim();
}

function knowledgeId(candidateId: string, senseId: string): string {
  return `knowledge:${encodeURIComponent(candidateId)}:${encodeURIComponent(senseId)}:v1`;
}

function uniqueProvenance(
  senses: readonly LexicalContent[],
  examples: readonly ExampleContent[],
  pronunciations: readonly PronunciationContent[],
  cefr: readonly CefrClassification[],
  frequency: FrequencyContent | undefined,
): readonly ContentProvenance[] {
  const values = [
    ...senses.map(({ provenance }) => provenance),
    ...examples.map(({ provenance }) => provenance),
    ...pronunciations.map(({ provenance }) => provenance),
    ...cefr.map(({ provenance }) => provenance),
    ...(frequency ? [frequency.provenance] : []),
  ];
  const seen = new Set<string>();

  return Object.freeze(
    values.filter((provenance) => {
      const key = [provenance.provider, provenance.sourceId ?? "", provenance.retrievedAt].join(
        ":",
      );
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }),
  );
}

export function createWordKnowledge(input: CreateWordKnowledgeInput): CreateWordKnowledgeResult {
  if (
    !Number.isFinite(input.decision.confidence) ||
    input.decision.confidence < 0 ||
    input.decision.confidence > 1
  ) {
    return failure(
      "invalid-confidence",
      "Contextual selection confidence must be between zero and one",
    );
  }

  const selected = input.evidence.lexicalSenses.find(
    ({ senseId }) => normalized(senseId) === normalized(input.decision.selectedSenseId),
  );
  if (!selected) {
    return failure(
      "selected-sense-not-found",
      "The selected sense must come from lexical evidence",
    );
  }
  if (!selected.definition) {
    return failure(
      "selected-sense-missing-definition",
      "The selected lexical sense must include a verified definition",
    );
  }

  const cefrMismatch = input.evidence.cefrClassifications.some(
    ({ senseId }) => normalized(senseId) !== normalized(selected.senseId),
  );
  const exampleMismatch = input.evidence.officialExamples.some(
    ({ senseId }) => normalized(senseId) !== normalized(selected.senseId),
  );
  if (cefrMismatch || exampleMismatch) {
    return failure(
      "part-of-speech-mismatch",
      "Sense-bound evidence must belong to the selected lexical sense",
    );
  }

  const selectedSense: SelectedLexicalSense = Object.freeze({
    senseId: selected.senseId,
    definition: selected.definition,
    partOfSpeech: selected.partOfSpeech,
    provenance: selected.provenance,
    confirmedBy:
      input.decision.resolution === "learner-confirmed"
        ? "learner-selection"
        : "unique-provider-match",
  });
  const alternatives = Object.freeze(
    input.evidence.lexicalSenses.filter(({ senseId }) => senseId !== selected.senseId),
  );

  return Object.freeze({
    ok: true,
    knowledge: Object.freeze({
      version: WORD_KNOWLEDGE_VERSION,
      knowledgeId: knowledgeId(normalized(input.candidateId), selected.senseId),
      candidateId: normalized(input.candidateId),
      displayForm: normalized(input.displayForm),
      normalizedLemma: normalized(input.normalizedLemma),
      partOfSpeech: selected.partOfSpeech,
      context: Object.freeze({ ...input.context }),
      decision: Object.freeze({
        ...input.decision,
        reasonCodes: Object.freeze([...input.decision.reasonCodes]),
      }),
      selectedSense,
      alternativeSenses: alternatives,
      evidence: Object.freeze({
        lexicalSenses: Object.freeze([...input.evidence.lexicalSenses]),
        officialExamples: Object.freeze([...input.evidence.officialExamples]),
        pronunciations: Object.freeze([...input.evidence.pronunciations]),
        cefrClassifications: Object.freeze([...input.evidence.cefrClassifications]),
        ...(input.evidence.frequency ? { frequency: input.evidence.frequency } : {}),
      }),
      exerciseCapabilities: Object.freeze([...(input.exerciseCapabilities ?? [])]),
      provenance: uniqueProvenance(
        input.evidence.lexicalSenses,
        input.evidence.officialExamples,
        input.evidence.pronunciations,
        input.evidence.cefrClassifications,
        input.evidence.frequency,
      ),
    }),
  });
}
