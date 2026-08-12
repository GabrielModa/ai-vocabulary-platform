import {
  LEARNING_ALGORITHM_VERSION,
  type LearningAlgorithmVersion,
  type MasteryState,
} from "@vocabulary/domain-vocabulary";

import { buildLocalLearningProfile } from "./adaptive-local-review";
import type { CompletedStudySession } from "./local-study-history";

export interface LocalLearningProgressSummary {
  readonly totalItems: number;
  readonly states: Readonly<Record<MasteryState, number>>;
  readonly dueNow: number;
  readonly retrievals: {
    readonly correct: number;
    readonly attempted: number;
    readonly accuracyPercentage: number;
  };
  readonly priorityTerms: readonly string[];
  readonly algorithmVersion: LearningAlgorithmVersion;
}

const statePriority: Readonly<Record<MasteryState, number>> = {
  review: 0,
  learning: 1,
  mastered: 2,
  new: 3,
};

export function summarizeLocalLearningProgress(
  sessions: readonly CompletedStudySession[],
  now: string,
): LocalLearningProgressSummary {
  const nowTime = Date.parse(now);
  if (!Number.isFinite(nowTime)) throw new Error("Learning progress requires a valid instant.");
  const profile = buildLocalLearningProfile(sessions);
  const states: Record<MasteryState, number> = { new: 0, learning: 0, review: 0, mastered: 0 };
  for (const { projection } of profile) states[projection.state] += 1;

  const due = profile
    .filter(({ projection }) => {
      const reviewTime = Date.parse(projection.nextReviewAt ?? "");
      return Number.isFinite(reviewTime) && reviewTime <= nowTime;
    })
    .sort((left, right) => {
      const byState = statePriority[left.projection.state] - statePriority[right.projection.state];
      if (byState !== 0) return byState;
      const byLapses = right.projection.lapses - left.projection.lapses;
      if (byLapses !== 0) return byLapses;
      return (
        Date.parse(left.projection.nextReviewAt ?? "") -
        Date.parse(right.projection.nextReviewAt ?? "")
      );
    });

  const attempts = sessions.flatMap(({ attempts }) => attempts).filter(({ voided }) => !voided);
  const correct = attempts.filter(({ correct: isCorrect }) => isCorrect).length;
  const attempted = attempts.length;
  const summary: LocalLearningProgressSummary = {
    totalItems: profile.length,
    states: Object.freeze(states),
    dueNow: due.length,
    retrievals: Object.freeze({
      correct,
      attempted,
      accuracyPercentage: attempted === 0 ? 0 : Math.round((correct / attempted) * 100),
    }),
    priorityTerms: Object.freeze(due.slice(0, 5).map(({ candidate }) => candidate.term)),
    algorithmVersion: LEARNING_ALGORITHM_VERSION,
  };
  return Object.freeze(summary);
}
