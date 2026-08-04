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

  return Object.freeze(
    verified.map((input) =>
      Object.freeze({
        candidateId: input.candidate.candidateId,
        outcome: runVerifiedExercisePipeline({
          answer: evidence(input),
          examples: input.examples,
          distractorPool,
        }),
      }),
    ),
  );
}
