import { OllamaVocabularyError, OllamaVocabularyGenerator } from "@vocabulary/ai";
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
} from "./lexical-enrichment";

async function generate(input: unknown) {
  const generator = new OllamaVocabularyGenerator({
    ...(process.env.OLLAMA_BASE_URL ? { baseUrl: process.env.OLLAMA_BASE_URL } : {}),
    ...(process.env.OLLAMA_MODEL ? { model: process.env.OLLAMA_MODEL } : {}),
  });

  const [generated, lexicalLookup, frequencyLookup, exampleLookup] = await Promise.all([
    generator.generate(input),
    loadLocalLexicalLookup(),
    loadLocalFrequencyLookup(),
    loadLocalExampleLookup(),
  ]);

  return enrichVocabularySet(generated, lexicalLookup, frequencyLookup, exampleLookup);
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
