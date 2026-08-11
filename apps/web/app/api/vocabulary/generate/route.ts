import {
  localVocabularyRequestSchema,
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

const generator = new OllamaVocabularyGenerator({
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

  return generateWithDeficitReplacement(request, {
    suggest: (generationRequest, options) => generator.generate(generationRequest, options),
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
}

export async function POST(request: Request): Promise<Response> {
  try {
    const runtime = getStudySessionRuntime();
    return await createAuthenticatedVocabularyGenerationHandler({
      identity: runtime.identity,
      drafts: runtime.drafts,
      generate,
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
