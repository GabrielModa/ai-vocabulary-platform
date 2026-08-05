import type { PublishedExerciseSelection } from "@vocabulary/domain-vocabulary";
import {
  orchestrateExerciseStrategies,
  type ExerciseStrategy,
} from "./exercise-strategy-orchestrator";

type ExerciseOutcome = PublishedExerciseSelection["outcome"];
type PublishedOutcome = Extract<ExerciseOutcome, { readonly outcome: "publish" }>;

export interface ReviewedExerciseStrategyContext {
  readonly legacyOutcome?: ExerciseOutcome;
  readonly definitionChoiceOutcome?: ExerciseOutcome;
}

function publishedOutcome(outcome: ExerciseOutcome | undefined): PublishedOutcome | undefined {
  return outcome?.outcome === "publish" ? outcome : undefined;
}

const strategies: readonly ExerciseStrategy<ReviewedExerciseStrategyContext, PublishedOutcome>[] =
  Object.freeze([
    Object.freeze({
      strategyId: "verified-cloze",
      supports: (context: ReviewedExerciseStrategyContext) =>
        publishedOutcome(context.legacyOutcome) !== undefined,
      score: () => 100,
      publish: (context: ReviewedExerciseStrategyContext) => {
        const publication = publishedOutcome(context.legacyOutcome);
        return publication === undefined
          ? {
              ok: false as const,
              code: "verified-cloze-unavailable",
              message: "Verified cloze did not publish",
            }
          : { ok: true as const, publication };
      },
    }),
    Object.freeze({
      strategyId: "definition-choice",
      supports: (context: ReviewedExerciseStrategyContext) =>
        publishedOutcome(context.definitionChoiceOutcome) !== undefined,
      score: () => 80,
      publish: (context: ReviewedExerciseStrategyContext) => {
        const publication = publishedOutcome(context.definitionChoiceOutcome);
        return publication === undefined
          ? {
              ok: false as const,
              code: "definition-choice-unavailable",
              message: "Definition choice did not publish",
            }
          : { ok: true as const, publication };
      },
    }),
  ]);

export function chooseReviewedExerciseOutcome(
  context: ReviewedExerciseStrategyContext,
): ExerciseOutcome {
  const result = orchestrateExerciseStrategies({
    context,
    strategies,
  });

  if (result.ok) return result.publication;

  return (
    context.legacyOutcome ??
    context.definitionChoiceOutcome ??
    Object.freeze({ outcome: "reject" as const })
  );
}
