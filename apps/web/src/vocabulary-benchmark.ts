import type { CefrLevel } from "@vocabulary/domain-vocabulary";
import type {
  VocabularyGenerationMetricFields,
  VocabularyGenerationStage,
} from "@vocabulary/observability";

export interface VocabularyBenchmarkRun {
  readonly caseId: string;
  readonly level: CefrLevel;
  readonly requestedCount: number;
  readonly metrics: readonly VocabularyGenerationMetricFields[];
}

export interface VocabularyBenchmarkSummary {
  readonly runCount: number;
  readonly exactFulfillmentRate: number;
  readonly totals: {
    readonly requestedCount: number;
    readonly deliveredCount: number;
    readonly rejectedCount: number;
    readonly attemptCount: number;
  };
  readonly stages: readonly {
    readonly stage: VocabularyGenerationStage;
    readonly sampleCount: number;
    readonly p50DurationMs: number;
    readonly p95DurationMs: number;
  }[];
}

function percentile(sorted: readonly number[], ratio: number): number {
  if (sorted.length === 0) return 0;
  const index = Math.max(0, Math.ceil(sorted.length * ratio) - 1);
  return sorted[index] ?? 0;
}

export function summarizeVocabularyBenchmark(
  runs: readonly VocabularyBenchmarkRun[],
): VocabularyBenchmarkSummary {
  const finalMetrics = runs.flatMap(({ metrics }) =>
    metrics.filter(({ stage }) => stage === "replacement"),
  );
  const exactCount = finalMetrics.filter(({ outcome }) => outcome === "exact").length;
  const stageDurations = new Map<VocabularyGenerationStage, number[]>();

  for (const { metrics } of runs) {
    for (const metric of metrics) {
      stageDurations.set(metric.stage, [
        ...(stageDurations.get(metric.stage) ?? []),
        metric.durationMs,
      ]);
    }
  }

  return Object.freeze({
    runCount: runs.length,
    exactFulfillmentRate:
      finalMetrics.length === 0 ? 0 : Math.round((exactCount / finalMetrics.length) * 100),
    totals: Object.freeze({
      requestedCount: runs.reduce((total, run) => total + run.requestedCount, 0),
      deliveredCount: finalMetrics.reduce((total, metric) => total + metric.deliveredCount, 0),
      rejectedCount: finalMetrics.reduce((total, metric) => total + metric.rejectedCount, 0),
      attemptCount: finalMetrics.reduce((total, metric) => total + metric.attemptCount, 0),
    }),
    stages: Object.freeze(
      [...stageDurations.entries()]
        .sort(([left], [right]) => left.localeCompare(right, "en"))
        .map(([stage, durations]) => {
          const sorted = [...durations].sort((left, right) => left - right);
          return Object.freeze({
            stage,
            sampleCount: sorted.length,
            p50DurationMs: percentile(sorted, 0.5),
            p95DurationMs: percentile(sorted, 0.95),
          });
        }),
    ),
  });
}
