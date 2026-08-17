import {
  runVerifiedExercisePipeline,
  type DistractorCandidateEvidence,
  type ExercisePipelineOutcome,
  type ExampleContent,
  type FrequencyContent,
  type LearningCandidate,
} from "@vocabulary/domain-vocabulary";

export interface PipelineCandidateInput {
  readonly candidate: LearningCandidate;
  readonly frequency?: FrequencyContent;
  readonly examples: readonly ExampleContent[];
}

export interface CandidatePipelineResult {
  readonly candidateId: string;
  readonly outcome: ExercisePipelineOutcome;
}

function evidence(input: PipelineCandidateInput): DistractorCandidateEvidence {
  return {
    candidate: input.candidate,
    ...(input.frequency ? { frequencyPercentile: input.frequency.percentile } : {}),
  };
}

export function runCandidateExercisePipelines(
  inputs: readonly PipelineCandidateInput[],
): readonly CandidatePipelineResult[] {
  const verified = inputs.filter((input) => input.candidate.selectedSense !== undefined);
  const distractorPool = Object.freeze(verified.map(evidence));
  const priorUseCountByCandidateId = new Map<string, number>();

  return Object.freeze(
    verified.map((input) => {
      const outcome = runVerifiedExercisePipeline({
        answer: evidence(input),
        examples: input.examples,
        distractorPool,
        priorDistractorUseCountByCandidateId: priorUseCountByCandidateId,
      });
      if (outcome.outcome === "publish" || outcome.outcome === "request-ai-fallback") {
        for (const candidateId of outcome.exercise.distractorCandidateIds) {
          priorUseCountByCandidateId.set(
            candidateId,
            (priorUseCountByCandidateId.get(candidateId) ?? 0) + 1,
          );
        }
      }
      return Object.freeze({
        candidateId: input.candidate.candidateId,
        outcome,
      });
    }),
  );
}
