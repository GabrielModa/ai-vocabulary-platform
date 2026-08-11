import { describe, expect, it } from "vitest";
import type { VocabularyGenerationMetricFields } from "@vocabulary/observability";
import { summarizeVocabularyBenchmark } from "./vocabulary-benchmark.js";

function metric(
  stage: VocabularyGenerationMetricFields["stage"],
  durationMs: number,
  outcome: VocabularyGenerationMetricFields["outcome"] = "succeeded",
): VocabularyGenerationMetricFields {
  return {
    stage,
    outcome,
    durationMs,
    requestedCount: 6,
    deliveredCount: outcome === "partial" ? 4 : 6,
    rejectedCount: outcome === "partial" ? 2 : 0,
    attemptCount: outcome === "partial" ? 3 : 1,
    cacheHit: false,
  };
}

describe("vocabulary benchmark summary", () => {
  it("aggregates bounded stage percentiles and fulfillment without content", () => {
    const summary = summarizeVocabularyBenchmark([
      {
        caseId: "case-01",
        level: "A2",
        requestedCount: 6,
        metrics: [metric("candidate-suggestion", 100), metric("replacement", 150, "exact")],
      },
      {
        caseId: "case-02",
        level: "B2",
        requestedCount: 6,
        metrics: [metric("candidate-suggestion", 300), metric("replacement", 500, "partial")],
      },
    ]);

    expect(summary).toEqual({
      runCount: 2,
      exactFulfillmentRate: 50,
      totals: { requestedCount: 12, deliveredCount: 10, rejectedCount: 2, attemptCount: 4 },
      stages: [
        { stage: "candidate-suggestion", sampleCount: 2, p50DurationMs: 100, p95DurationMs: 300 },
        { stage: "replacement", sampleCount: 2, p50DurationMs: 150, p95DurationMs: 500 },
      ],
    });
    expect(JSON.stringify(summary)).not.toContain("football");
  });
});
