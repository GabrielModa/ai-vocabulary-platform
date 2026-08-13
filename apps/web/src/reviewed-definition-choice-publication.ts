import {
  createWordKnowledge,
  mapDefinitionChoicePublication,
  publishDefinitionChoice,
  resolveCandidateKnowledge,
  type ExampleContent,
  type LearningCandidate,
  type LexicalContent,
  type PublishedExerciseSelection,
  type WordKnowledgeContext,
} from "@vocabulary/domain-vocabulary";

export interface ReviewedLexicalSourceCandidate {
  readonly candidateId: string;
  readonly frequencyPercentile?: number;
  readonly verifiedExamples?: readonly ExampleContent[];
  readonly verifiedExamplesBySenseId?: Readonly<Record<string, readonly ExampleContent[]>>;
  readonly term?: string;
  readonly normalizedLemma?: string;
  readonly type?: LexicalContent["partOfSpeech"];
  readonly lexicalValidationStatus?: "verified" | "provisional" | "unavailable";
  readonly lexicalSenses?: readonly LexicalContent[];
}

export interface PublishReviewedDefinitionChoicesInput {
  readonly candidates: readonly LearningCandidate[];
  readonly sources: readonly ReviewedLexicalSourceCandidate[];
  readonly context: WordKnowledgeContext;
}

export interface ReviewedDefinitionChoiceOutcome {
  readonly candidateId: string;
  readonly outcome: PublishedExerciseSelection["outcome"];
}

function supplementalDistractorKnowledge(
  source: ReviewedLexicalSourceCandidate,
  context: WordKnowledgeContext,
) {
  if (
    source.lexicalValidationStatus !== "verified" ||
    source.term === undefined ||
    source.normalizedLemma === undefined ||
    source.type === undefined ||
    source.lexicalSenses === undefined
  ) {
    return undefined;
  }

  const eligibleSenses = source.lexicalSenses.filter(
    (sense) => sense.partOfSpeech === source.type && Boolean(sense.definition?.trim()),
  );
  if (eligibleSenses.length !== 1) {
    return undefined;
  }

  const selectedSense = eligibleSenses[0];
  if (selectedSense === undefined) {
    return undefined;
  }

  const result = createWordKnowledge({
    candidateId: source.candidateId,
    displayForm: source.term,
    normalizedLemma: source.normalizedLemma,
    context,
    decision: {
      selectedSenseId: selectedSense.senseId,
      resolution: "auto-selected",
      confidence: 1,
      reasonCodes: ["single-verified-sense"],
      decidedBy: "single-verified-sense",
    },
    evidence: {
      lexicalSenses: [selectedSense],
      officialExamples: [],
      pronunciations: [],
      cefrClassifications: [],
    },
  });

  return result.ok
    ? Object.freeze({
        candidateId: source.candidateId,
        knowledge: result.knowledge,
        frequencyPercentile: source.frequencyPercentile,
      })
    : undefined;
}

export function publishReviewedDefinitionChoices(
  input: PublishReviewedDefinitionChoicesInput,
): readonly ReviewedDefinitionChoiceOutcome[] {
  const sourceByCandidateId = new Map(input.sources.map((source) => [source.candidateId, source]));

  const resolved = input.candidates.flatMap((candidate) => {
    const source = sourceByCandidateId.get(candidate.candidateId);
    const selectedSenseId = candidate.selectedSense?.senseId;
    const examples =
      selectedSenseId === undefined
        ? []
        : (source?.verifiedExamplesBySenseId?.[selectedSenseId] ?? source?.verifiedExamples ?? []);

    const result = resolveCandidateKnowledge({
      candidate,
      context: input.context,
      evidence: {
        examplesBySenseId: selectedSenseId === undefined ? {} : { [selectedSenseId]: examples },
      },
    });

    return result.ok && result.status === "resolved"
      ? [
          Object.freeze({
            candidateId: candidate.candidateId,
            knowledge: result.knowledge,
            frequencyPercentile: source?.frequencyPercentile,
          }),
        ]
      : [];
  });

  const reviewedCandidateIds = new Set(input.candidates.map(({ candidateId }) => candidateId));
  const supplemental = input.sources.flatMap((source) => {
    if (reviewedCandidateIds.has(source.candidateId)) {
      return [];
    }
    const resolvedSource = supplementalDistractorKnowledge(source, input.context);
    return resolvedSource === undefined ? [] : [resolvedSource];
  });
  const distractorPool = [...resolved, ...supplemental];

  return Object.freeze(
    resolved.map((target) => {
      const publication = publishDefinitionChoice({
        target: {
          knowledge: target.knowledge,
          ...(target.frequencyPercentile !== undefined
            ? { frequencyPercentile: target.frequencyPercentile }
            : {}),
        },
        pool: distractorPool
          .filter(({ candidateId }) => candidateId !== target.candidateId)
          .map((candidate) => ({
            knowledge: candidate.knowledge,
            ...(candidate.frequencyPercentile !== undefined
              ? { frequencyPercentile: candidate.frequencyPercentile }
              : {}),
          })),
      });

      if (!publication.ok) {
        return Object.freeze({
          candidateId: target.candidateId,
          outcome: Object.freeze({ outcome: "reject" as const }),
        });
      }

      const mapped = mapDefinitionChoicePublication(publication.publication);

      return Object.freeze({
        candidateId: target.candidateId,
        outcome: mapped.ok
          ? Object.freeze({
              outcome: "publish" as const,
              exercise: mapped.exercise,
            })
          : Object.freeze({ outcome: "reject" as const }),
      });
    }),
  );
}
