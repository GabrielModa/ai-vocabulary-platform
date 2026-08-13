import {
  localVocabularyRequestSchema,
  OllamaExampleGenerator,
  OllamaVocabularyError,
  OllamaVocabularyGenerator,
} from "@vocabulary/ai";
import {
  getStudySessionRuntime,
  StudySessionRuntimeUnavailableError,
} from "../../../../src/study-session-runtime-registry";
import { createAuthenticatedVocabularyGenerationHandler } from "./authenticated-generation";
import {
  enrichVocabularySet,
  loadLocalExampleLookup,
  loadLocalFrequencyLookup,
  loadLocalLexicalLookup,
  loadLocalPronunciationLookup,
} from "./lexical-enrichment";
import { generateWithDeficitReplacement } from "./replacement-generation";
import { suggestCandidatesWithTrustedFirst } from "./candidate-suggestion";
import { enrichMissingStudyExamples } from "./generated-example-enrichment";
import { resolveVocabularySetContextually } from "./contextual-lexical-enrichment";
import { OllamaContextualSenseSelector } from "../../../../src/ollama-contextual-sense-selector";
import { generateTrustedSupplementalDistractors } from "./supplemental-distractor-generation";

const generator = new OllamaVocabularyGenerator({
  ...(process.env.OLLAMA_BASE_URL ? { baseUrl: process.env.OLLAMA_BASE_URL } : {}),
  ...(process.env.OLLAMA_MODEL ? { model: process.env.OLLAMA_MODEL } : {}),
});
const exampleGenerator = new OllamaExampleGenerator({
  ...(process.env.OLLAMA_BASE_URL ? { baseUrl: process.env.OLLAMA_BASE_URL } : {}),
  ...(process.env.OLLAMA_MODEL ? { model: process.env.OLLAMA_MODEL } : {}),
});
const contextualSenseSelector = new OllamaContextualSenseSelector({
  ...(process.env.OLLAMA_BASE_URL ? { baseUrl: process.env.OLLAMA_BASE_URL } : {}),
  ...(process.env.OLLAMA_MODEL ? { model: process.env.OLLAMA_MODEL } : {}),
});

async function generate(input: unknown) {
  const request = localVocabularyRequestSchema.parse(input);

  const lookups = Promise.all([
    loadLocalLexicalLookup(),
    loadLocalFrequencyLookup(),
    loadLocalExampleLookup(),
    loadLocalPronunciationLookup(),
  ]);

  const vocabularySet = await generateWithDeficitReplacement(request, {
    suggest: (generationRequest, options) =>
      suggestCandidatesWithTrustedFirst(
        generationRequest,
        options,
        (fallbackRequest, fallbackOptions) => generator.generate(fallbackRequest, fallbackOptions),
      ),
    enrich: async (generated) => {
      const [lexicalLookup, frequencyLookup, exampleLookup, pronunciationLookup] = await lookups;
      return enrichVocabularySet(
        generated,
        lexicalLookup,
        frequencyLookup,
        exampleLookup,
        pronunciationLookup,
        { topic: request.topic, level: request.level },
      );
    },
  });
  const contextuallyResolved = await resolveVocabularySetContextually(vocabularySet, {
    selector: contextualSenseSelector,
    context: { topic: request.topic, learnerLevel: request.level, locale: "en-US" },
  });
  return enrichMissingStudyExamples(contextuallyResolved, {
    topic: request.topic,
    level: request.level,
    generate: (exampleRequest) => exampleGenerator.generate(exampleRequest),
  });
}

export async function POST(request: Request): Promise<Response> {
  try {
    const runtime = getStudySessionRuntime();
    return await createAuthenticatedVocabularyGenerationHandler({
      identity: runtime.identity,
      drafts: runtime.drafts,
      generate,
      generateSupplemental: async (input, generated) => {
        const [lexicalLookup, frequencyLookup, exampleLookup, pronunciationLookup] =
          await Promise.all([
            loadLocalLexicalLookup(),
            loadLocalFrequencyLookup(),
            loadLocalExampleLookup(),
            loadLocalPronunciationLookup(),
          ]);
        return generateTrustedSupplementalDistractors(input, generated, {
          lexicalLookup,
          frequencyLookup,
          exampleLookup,
          pronunciationLookup,
        });
      },
    })(request);
  } catch (error) {
    if (error instanceof StudySessionRuntimeUnavailableError) {
      return Response.json({ code: "GENERATION_RUNTIME_UNAVAILABLE" }, { status: 503 });
    }
    if (error instanceof OllamaVocabularyError && error.code === "UNAVAILABLE") {
      return Response.json({ code: "OLLAMA_UNAVAILABLE" }, { status: 503 });
    }
    return Response.json({ code: "GENERATION_FAILED" }, { status: 422 });
  }
}
