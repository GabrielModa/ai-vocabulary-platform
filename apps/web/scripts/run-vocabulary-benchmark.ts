import { OllamaVocabularyGenerator, type LocalVocabularyRequest } from "@vocabulary/ai";
import type { VocabularyGenerationMetricFields } from "@vocabulary/observability";
import {
  enrichVocabularySet,
  loadLocalExampleLookup,
  loadLocalFrequencyLookup,
  loadLocalLexicalLookup,
  loadLocalPronunciationLookup,
} from "../app/api/vocabulary/generate/lexical-enrichment.js";
import { generateWithDeficitReplacement } from "../app/api/vocabulary/generate/replacement-generation.js";
import {
  summarizeVocabularyBenchmark,
  type VocabularyBenchmarkRun,
} from "../src/vocabulary-benchmark.js";

const smokeMatrix: readonly LocalVocabularyRequest[] = Object.freeze([
  { topic: "football", level: "A2", requestedCount: 6 },
  { topic: "work", level: "B1", requestedCount: 6 },
]);

const extendedMatrix: readonly LocalVocabularyRequest[] = Object.freeze([
  ...smokeMatrix,
  { topic: "travel", level: "B2", requestedCount: 8 },
  { topic: "technology", level: "C1", requestedCount: 6 },
  { topic: "education", level: "C2", requestedCount: 6 },
]);

async function main(): Promise<void> {
  const matrix = process.argv.includes("--extended") ? extendedMatrix : smokeMatrix;
  const generator = new OllamaVocabularyGenerator({
    ...(process.env.OLLAMA_BASE_URL ? { baseUrl: process.env.OLLAMA_BASE_URL } : {}),
    ...(process.env.OLLAMA_MODEL ? { model: process.env.OLLAMA_MODEL } : {}),
  });
  const lookups = await Promise.all([
    loadLocalLexicalLookup(),
    loadLocalFrequencyLookup(),
    loadLocalExampleLookup(),
    loadLocalPronunciationLookup(),
  ]);
  const runs: VocabularyBenchmarkRun[] = [];

  for (const [index, request] of matrix.entries()) {
    const metrics: VocabularyGenerationMetricFields[] = [];
    await generateWithDeficitReplacement(request, {
      recordMetric: (metric) => metrics.push(metric),
      suggest: (generationRequest, options) => generator.generate(generationRequest, options),
      enrich: (generated) =>
        enrichVocabularySet(generated, ...lookups, {
          topic: request.topic,
          level: request.level,
        }),
    });
    runs.push({
      caseId: `case-${String(index + 1).padStart(2, "0")}`,
      level: request.level,
      requestedCount: request.requestedCount,
      metrics,
    });
  }

  process.stdout.write(`${JSON.stringify(summarizeVocabularyBenchmark(runs), null, 2)}\n`);
}

main().catch(() => {
  process.stderr.write("Vocabulary benchmark failed: verify Ollama and local lexical indexes.\n");
  process.exitCode = 1;
});
