import { OllamaVocabularyError, OllamaVocabularyGenerator } from "@vocabulary/ai";
import type { VocabularyGenerationMetricFields } from "@vocabulary/observability";
import {
  enrichVocabularySet,
  loadLocalExampleLookup,
  loadLocalFrequencyLookup,
  loadLocalLexicalLookup,
  loadLocalPronunciationLookup,
} from "../app/api/vocabulary/generate/lexical-enrichment.js";
import { suggestCandidatesWithTrustedFirst } from "../app/api/vocabulary/generate/candidate-suggestion.js";
import { generateWithDeficitReplacement } from "../app/api/vocabulary/generate/replacement-generation.js";
import {
  summarizeVocabularyBenchmark,
  type VocabularyBenchmarkRun,
} from "../src/vocabulary-benchmark.js";
import { selectVocabularyBenchmarkCases } from "../src/vocabulary-benchmark-cases.js";

async function main(): Promise<void> {
  const arguments_ = process.argv.slice(2);
  const matrix = selectVocabularyBenchmarkCases(arguments_);
  const modelComparison = arguments_.includes("--model-comparison");
  const model = process.env.OLLAMA_MODEL ?? "qwen2.5:3b";
  const generator = new OllamaVocabularyGenerator({
    ...(process.env.OLLAMA_BASE_URL ? { baseUrl: process.env.OLLAMA_BASE_URL } : {}),
    model,
  });
  const lookups = await Promise.all([
    loadLocalLexicalLookup(),
    loadLocalFrequencyLookup(),
    loadLocalExampleLookup(),
    loadLocalPronunciationLookup(),
  ]);
  const runs: VocabularyBenchmarkRun[] = [];
  const failures: { readonly caseId: string; readonly code: string }[] = [];

  for (const [index, request] of matrix.entries()) {
    const metrics: VocabularyGenerationMetricFields[] = [];
    try {
      await generateWithDeficitReplacement(request, {
        recordMetric: (metric) => metrics.push(metric),
        suggest: (generationRequest, options) =>
          modelComparison
            ? generator.generate(generationRequest, options)
            : suggestCandidatesWithTrustedFirst(
                generationRequest,
                options,
                (fallbackRequest, fallbackOptions) =>
                  generator.generate(fallbackRequest, fallbackOptions),
              ),
        enrich: (generated) =>
          enrichVocabularySet(generated, ...lookups, {
            topic: request.topic,
            level: request.level,
          }),
      });
    } catch (error) {
      const code = error instanceof OllamaVocabularyError ? error.code : "PIPELINE_FAILURE";
      const caseId = `case-${String(index + 1).padStart(2, "0")}`;
      process.stderr.write(
        `Benchmark case ${String(index + 1).padStart(2, "0")} failed with ${code}.\n`,
      );
      failures.push({ caseId, code });
      runs.push({
        caseId,
        level: request.level,
        requestedCount: request.requestedCount,
        metrics,
      });
      continue;
    }
    runs.push({
      caseId: `case-${String(index + 1).padStart(2, "0")}`,
      level: request.level,
      requestedCount: request.requestedCount,
      metrics,
    });
  }

  process.stdout.write(
    `${JSON.stringify(
      {
        mode: modelComparison ? "direct-model-comparison" : "trusted-first",
        model,
        successfulCaseCount: matrix.length - failures.length,
        failedCaseCount: failures.length,
        failures,
        summary: summarizeVocabularyBenchmark(runs),
      },
      null,
      2,
    )}\n`,
  );
}

main().catch(() => {
  process.stderr.write("Vocabulary benchmark failed: verify Ollama and local lexical indexes.\n");
  process.exitCode = 1;
});
