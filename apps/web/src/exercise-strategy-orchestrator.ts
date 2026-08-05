export interface ExerciseStrategySuccess<TPublication> {
  readonly ok: true;
  readonly publication: TPublication;
}

export interface ExerciseStrategyFailure {
  readonly ok: false;
  readonly code: string;
  readonly message: string;
}

export type ExerciseStrategyResult<TPublication> =
  ExerciseStrategySuccess<TPublication> | ExerciseStrategyFailure;

export interface ExerciseStrategy<TContext, TPublication> {
  readonly strategyId: string;
  supports(context: TContext): boolean;
  score(context: TContext): number;
  publish(context: TContext): ExerciseStrategyResult<TPublication>;
}

export interface ExerciseStrategyAttempt {
  readonly strategyId: string;
  readonly score: number;
  readonly outcome: "published" | "failed";
  readonly failureCode?: string;
}

export type OrchestrateExerciseStrategiesResult<TPublication> =
  | {
      readonly ok: true;
      readonly strategyId: string;
      readonly publication: TPublication;
      readonly attempts: readonly ExerciseStrategyAttempt[];
    }
  | {
      readonly ok: false;
      readonly code: "no-supported-strategy" | "no-strategy-published";
      readonly message: string;
      readonly attempts: readonly ExerciseStrategyAttempt[];
    };

export interface OrchestrateExerciseStrategiesInput<TContext, TPublication> {
  readonly context: TContext;
  readonly strategies: readonly ExerciseStrategy<TContext, TPublication>[];
}

function normalizedScore(score: number): number {
  return Number.isFinite(score) ? score : 0;
}

export function orchestrateExerciseStrategies<TContext, TPublication>(
  input: OrchestrateExerciseStrategiesInput<TContext, TPublication>,
): OrchestrateExerciseStrategiesResult<TPublication> {
  const supported = input.strategies
    .filter((strategy) => strategy.supports(input.context))
    .map((strategy) => ({
      strategy,
      score: normalizedScore(strategy.score(input.context)),
    }))
    .sort((left, right) => {
      const scoreDifference = right.score - left.score;
      return scoreDifference !== 0
        ? scoreDifference
        : left.strategy.strategyId.localeCompare(right.strategy.strategyId, "en-US");
    });

  if (supported.length === 0) {
    return Object.freeze({
      ok: false,
      code: "no-supported-strategy",
      message: "No exercise strategy supports the current context",
      attempts: Object.freeze([]),
    });
  }

  const attempts: ExerciseStrategyAttempt[] = [];

  for (const candidate of supported) {
    const result = candidate.strategy.publish(input.context);

    if (result.ok) {
      attempts.push(
        Object.freeze({
          strategyId: candidate.strategy.strategyId,
          score: candidate.score,
          outcome: "published",
        }),
      );

      return Object.freeze({
        ok: true,
        strategyId: candidate.strategy.strategyId,
        publication: result.publication,
        attempts: Object.freeze([...attempts]),
      });
    }

    attempts.push(
      Object.freeze({
        strategyId: candidate.strategy.strategyId,
        score: candidate.score,
        outcome: "failed",
        failureCode: result.code,
      }),
    );
  }

  return Object.freeze({
    ok: false,
    code: "no-strategy-published",
    message: "Supported exercise strategies failed to publish",
    attempts: Object.freeze([...attempts]),
  });
}
