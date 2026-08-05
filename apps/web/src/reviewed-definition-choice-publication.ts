import {
  mapDefinitionChoicePublication,
  publishDefinitionChoice,
  resolveCandidateKnowledge,
  type ExampleContent,
  type LearningCandidate,
  type PublishedExerciseSelection,
  type WordKnowledgeContext,
} from "@vocabulary/domain-vocabulary";

export interface ReviewedLexicalSourceCandidate {
  readonly candidateId: string;
  readonly frequencyPercentile?: number;
  readonly verifiedExamples?: readonly ExampleContent[];
  readonly verifiedExamplesBySenseId?: Readonly<Record<string, readonly ExampleContent[]>>;
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

  return Object.freeze(
    resolved.map((target) => {
      const publication = publishDefinitionChoice({
        target: {
          knowledge: target.knowledge,
          ...(target.frequencyPercentile !== undefined
            ? { frequencyPercentile: target.frequencyPercentile }
            : {}),
        },
        pool: resolved
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
