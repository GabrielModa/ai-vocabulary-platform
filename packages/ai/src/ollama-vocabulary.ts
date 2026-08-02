import { z } from "zod";

export const localVocabularyRequestSchema = z.object({
  topic: z.string().trim().min(2).max(200),
  requestedCount: z.number().int().min(1).max(50),
  level: z.enum(["A2", "B1", "B2", "C1", "C2"]),
});
export const localVocabularySetSchema = z.object({
  title: z.string().trim().min(1).max(200),
  candidates: z
    .array(
      z.object({
        term: z.string().trim().min(1).max(200),
        meaning: z.string().trim().min(1).max(500),
        type: z.enum([
          "noun",
          "verb",
          "adjective",
          "adverb",
          "collocation",
          "phrasal-verb",
          "expression",
          "other",
        ]),
        example: z.string().trim().min(1).max(1_000),
        challenge: z.string().trim().min(1).max(1_000),
        contexts: z.array(z.string().trim().min(1).max(1_000)).length(3).optional(),
      }),
    )
    .min(1)
    .max(50),
});
export type LocalVocabularyRequest = z.infer<typeof localVocabularyRequestSchema>;
export type LocalVocabularySet = z.infer<typeof localVocabularySetSchema>;
export type OllamaFetch = (input: string, init: RequestInit) => Promise<Response>;
const cefrGuidance: Record<LocalVocabularyRequest["level"], string> = {
  A2: "Use frequent concrete words and short simple-present or simple-past sentences.",
  B1: "Use practical everyday vocabulary and clear sentences with common connectors.",
  B2: "Use more precise vocabulary, collocations, and moderately complex natural sentences.",
  C1: "Use nuanced, less frequent vocabulary and complex but natural sentences.",
  C2: "Use highly precise, idiomatic, or specialized vocabulary with sophisticated contexts.",
};
export class OllamaVocabularyError extends Error {
  constructor(readonly code: "UNAVAILABLE" | "INVALID_OUTPUT") {
    super(`Local vocabulary generation failed: ${code}`);
    this.name = "OllamaVocabularyError";
  }
}
export class OllamaVocabularyGenerator {
  constructor(
    private readonly options: {
      readonly baseUrl?: string;
      readonly model?: string;
      readonly fetch?: OllamaFetch;
    } = {},
  ) {}
  async generate(input: unknown): Promise<LocalVocabularySet> {
    const request = localVocabularyRequestSchema.safeParse(input);
    if (!request.success) throw new OllamaVocabularyError("INVALID_OUTPUT");
    const fetcher = this.options.fetch ?? globalThis.fetch;
    const candidates: LocalVocabularySet["candidates"] = [];
    let title = `${request.data.topic} vocabulary`;
    while (candidates.length < request.data.requestedCount) {
      const batchCount = Math.min(8, request.data.requestedCount - candidates.length);
      let batch: LocalVocabularySet | undefined;
      for (let attempt = 0; attempt < 2 && !batch; attempt += 1) {
        try {
          batch = await this.generateBatch(
            request.data,
            batchCount,
            candidates.map(({ term }) => term),
            fetcher,
          );
        } catch (error) {
          if (error instanceof OllamaVocabularyError && error.code === "UNAVAILABLE") throw error;
          if (attempt === 1) throw error;
        }
      }
      if (!batch) throw new OllamaVocabularyError("INVALID_OUTPUT");
      if (candidates.length === 0) title = batch.title;
      candidates.push(...batch.candidates);
    }
    const terms = candidates.map(({ term }) => term.toLocaleLowerCase("en-US"));
    if (new Set(terms).size !== terms.length) throw new OllamaVocabularyError("INVALID_OUTPUT");
    return { title, candidates };
  }

  private async generateBatch(
    request: LocalVocabularyRequest,
    batchCount: number,
    excludedTerms: readonly string[],
    fetcher: OllamaFetch,
  ): Promise<LocalVocabularySet> {
    let response: Response;
    try {
      response = await fetcher(`${this.options.baseUrl ?? "http://127.0.0.1:11434"}/api/chat`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          model: this.options.model ?? "qwen2.5:3b",
          stream: false,
          format: "json",
          options: { temperature: 0.2 },
          messages: [
            {
              role: "system",
              content: `You create accurate English learning content. Return JSON only. Apply CEFR strictly to both vocabulary difficulty and sentence grammar. ${cefrGuidance[request.level]} Each challenge must contain exactly one ___ replacing the target term. Never include phonetic transcriptions.`,
            },
            {
              role: "user",
              content: `Create exactly ${String(batchCount)} unique ${request.level} English vocabulary items about ${request.topic}. ${cefrGuidance[request.level]} Return {title,candidates:[{term,meaning,type,example,challenge,contexts}]}. contexts must contain exactly three natural ${request.level} sentences using the term in genuinely different situations. Avoid these existing terms: ${excludedTerms.length ? excludedTerms.join(", ") : "none"}. Balance useful word classes and expressions.`,
            },
          ],
        }),
      });
    } catch {
      throw new OllamaVocabularyError("UNAVAILABLE");
    }
    if (!response.ok) throw new OllamaVocabularyError("UNAVAILABLE");
    const envelope = z
      .object({ message: z.object({ content: z.string() }) })
      .safeParse(await response.json());
    if (!envelope.success) throw new OllamaVocabularyError("INVALID_OUTPUT");
    let decoded: unknown;
    try {
      decoded = JSON.parse(envelope.data.message.content);
    } catch {
      throw new OllamaVocabularyError("INVALID_OUTPUT");
    }
    const result = localVocabularySetSchema.safeParse(decoded);
    if (!result.success || result.data.candidates.length !== batchCount)
      throw new OllamaVocabularyError("INVALID_OUTPUT");
    const terms = result.data.candidates.map(({ term }) => term.toLocaleLowerCase("en-US"));
    if (new Set(terms).size !== terms.length) throw new OllamaVocabularyError("INVALID_OUTPUT");
    return result.data;
  }
}
