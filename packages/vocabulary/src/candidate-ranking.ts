import type { LearningCandidate } from "./candidate-pipeline.js";

export type CandidateRankingReason =
  | "verified-sense"
  | "ambiguous-sense"
  | "provisional-lexical-data"
  | "unavailable-lexical-data"
  | "topic-relevance"
  | "requested-by-learner"
  | "already-mastered"
  | "recently-practiced"
  | "frequency-supported"
  | "level-aligned";

export interface CandidateRankingEvidence {
  readonly topicRelevance?: number;
  readonly requestedByLearner?: boolean;
  readonly alreadyMastered?: boolean;
  readonly recentlyPracticed?: boolean;
  readonly frequencyPercentile?: number;
  readonly levelDistance?: number;
}

export interface CandidateRankingPolicy {
  readonly verifiedSenseWeight: number;
  readonly ambiguousSenseWeight: number;
  readonly provisionalLexicalWeight: number;
  readonly unavailableLexicalWeight: number;
  readonly topicRelevanceWeight: number;
  readonly requestedByLearnerWeight: number;
  readonly alreadyMasteredWeight: number;
  readonly recentlyPracticedWeight: number;
  readonly frequencyWeight: number;
  readonly levelAlignmentWeight: number;
}

export interface CandidateRankingInput {
  readonly candidate: LearningCandidate;
  readonly evidence?: CandidateRankingEvidence;
}

export interface CandidateScoreContribution {
  readonly reason: CandidateRankingReason;
  readonly points: number;
}

export interface RankedCandidate {
  readonly candidate: LearningCandidate;
  readonly score: number;
  readonly rank: number;
  readonly contributions: readonly CandidateScoreContribution[];
}

export interface CandidateRankingResult {
  readonly ranked: readonly RankedCandidate[];
  readonly policy: CandidateRankingPolicy;
  readonly strategy: "deterministic-weighted-ranking";
}

export const defaultCandidateRankingPolicy: CandidateRankingPolicy = Object.freeze({
  verifiedSenseWeight: 40,
  ambiguousSenseWeight: 15,
  provisionalLexicalWeight: 5,
  unavailableLexicalWeight: -30,
  topicRelevanceWeight: 25,
  requestedByLearnerWeight: 30,
  alreadyMasteredWeight: -40,
  recentlyPracticedWeight: -15,
  frequencyWeight: 10,
  levelAlignmentWeight: 15,
});

function bounded(value: number | undefined, minimum: number, maximum: number): number | undefined {
  if (value === undefined || !Number.isFinite(value)) return undefined;
  return Math.min(maximum, Math.max(minimum, value));
}

function lexicalContribution(
  candidate: LearningCandidate,
  policy: CandidateRankingPolicy,
): CandidateScoreContribution {
  switch (candidate.lexicalStatus) {
    case "verified":
      return { reason: "verified-sense", points: policy.verifiedSenseWeight };
    case "ambiguous":
      return { reason: "ambiguous-sense", points: policy.ambiguousSenseWeight };
    case "provisional":
      return { reason: "provisional-lexical-data", points: policy.provisionalLexicalWeight };
    case "unavailable":
      return { reason: "unavailable-lexical-data", points: policy.unavailableLexicalWeight };
  }
}

function scoreCandidate(
  input: CandidateRankingInput,
  policy: CandidateRankingPolicy,
): Omit<RankedCandidate, "rank"> {
  const evidence = input.evidence;
  const contributions: CandidateScoreContribution[] = [
    lexicalContribution(input.candidate, policy),
  ];

  const topicRelevance = bounded(evidence?.topicRelevance, 0, 1);
  if (topicRelevance !== undefined) {
    contributions.push({
      reason: "topic-relevance",
      points: Math.round(topicRelevance * policy.topicRelevanceWeight),
    });
  }

  if (evidence?.requestedByLearner) {
    contributions.push({
      reason: "requested-by-learner",
      points: policy.requestedByLearnerWeight,
    });
  }

  if (evidence?.alreadyMastered) {
    contributions.push({
      reason: "already-mastered",
      points: policy.alreadyMasteredWeight,
    });
  }

  if (evidence?.recentlyPracticed) {
    contributions.push({
      reason: "recently-practiced",
      points: policy.recentlyPracticedWeight,
    });
  }

  const frequencyPercentile = bounded(evidence?.frequencyPercentile, 0, 1);
  if (frequencyPercentile !== undefined) {
    contributions.push({
      reason: "frequency-supported",
      points: Math.round(frequencyPercentile * policy.frequencyWeight),
    });
  }

  const levelDistance = bounded(evidence?.levelDistance, 0, 1);
  if (levelDistance !== undefined) {
    contributions.push({
      reason: "level-aligned",
      points: Math.round((1 - levelDistance) * policy.levelAlignmentWeight),
    });
  }

  return {
    candidate: input.candidate,
    score: contributions.reduce((total, contribution) => total + contribution.points, 0),
    contributions: Object.freeze(contributions),
  };
}

function compareRankedCandidates(
  left: Omit<RankedCandidate, "rank">,
  right: Omit<RankedCandidate, "rank">,
): number {
  if (right.score !== left.score) return right.score - left.score;
  return left.candidate.candidateId.localeCompare(right.candidate.candidateId, "en-US");
}

export function rankLearningCandidates(
  inputs: readonly CandidateRankingInput[],
  policy: CandidateRankingPolicy = defaultCandidateRankingPolicy,
): CandidateRankingResult {
  const scored = inputs.map((input) => scoreCandidate(input, policy)).sort(compareRankedCandidates);
  const ranked = scored.map((item, index) =>
    Object.freeze({
      ...item,
      rank: index + 1,
    }),
  );

  return Object.freeze({
    ranked: Object.freeze(ranked),
    policy: Object.freeze({ ...policy }),
    strategy: "deterministic-weighted-ranking",
  });
}
