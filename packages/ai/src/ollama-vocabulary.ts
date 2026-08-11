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
const suggestedCandidateSchema = z.object({
  term: z.string().trim().min(1).max(200),
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
});
const suggestionSetSchema = z.object({
  candidates: z.array(suggestedCandidateSchema).min(1).max(20),
});
export type LocalVocabularyRequest = z.infer<typeof localVocabularyRequestSchema>;
export type LocalVocabularySet = z.infer<typeof localVocabularySetSchema>;
export interface LocalVocabularyGenerationOptions {
  readonly excludedTerms?: readonly string[];
}
export type OllamaFetch = (input: string, init: RequestInit) => Promise<Response>;
const cefrGuidance: Record<LocalVocabularyRequest["level"], string> = {
  A2: "Use frequent concrete words and short simple-present or simple-past sentences.",
  B1: "Use practical everyday vocabulary and clear sentences with common connectors.",
  B2: "Use more precise vocabulary, collocations, and moderately complex natural sentences.",
  C1: "Use nuanced, less frequent vocabulary and complex but natural sentences.",
  C2: "Use highly precise, idiomatic, or specialized vocabulary with sophisticated contexts.",
};
const PENDING_MEANING = "Meaning pending lexical verification.";
const PENDING_EXAMPLE = "A verified example is not available yet.";
const PENDING_CHALLENGE = "Confirm the intended meaning before training.";
const CACHE_TTL_MS = 15 * 60 * 1000;
const CACHE_MAX_ENTRIES = 50;

interface CacheEntry {
  readonly expiresAt: number;
  readonly value: LocalVocabularySet;
}

function suggestionFormat(batchCount: number) {
  return {
    type: "object",
    additionalProperties: false,
    required: ["candidates"],
    properties: {
      candidates: {
        type: "array",
        minItems: batchCount,
        maxItems: batchCount,
        items: {
          type: "object",
          additionalProperties: false,
          required: ["term", "type"],
          properties: {
            term: { type: "string" },
            type: {
              type: "string",
              enum: [
                "noun",
                "verb",
                "adjective",
                "adverb",
                "collocation",
                "phrasal-verb",
                "expression",
                "other",
              ],
            },
          },
        },
      },
    },
  } as const;
}
export class OllamaVocabularyError extends Error {
  constructor(readonly code: "UNAVAILABLE" | "INVALID_OUTPUT") {
    super(`Local vocabulary generation failed: ${code}`);
    this.name = "OllamaVocabularyError";
  }
}
export class OllamaVocabularyGenerator {
  private readonly cache = new Map<string, CacheEntry>();

  constructor(
    private readonly options: {
      readonly baseUrl?: string;
      readonly model?: string;
      readonly fetch?: OllamaFetch;
    } = {},
  ) {}
  async generate(
    input: unknown,
    options: LocalVocabularyGenerationOptions = {},
  ): Promise<LocalVocabularySet> {
    const request = localVocabularyRequestSchema.safeParse(input);
    if (!request.success) throw new OllamaVocabularyError("INVALID_OUTPUT");
    const initiallyExcluded = [
      ...new Set(
        (options.excludedTerms ?? []).map((term) =>
          term.normalize("NFKC").toLocaleLowerCase("en-US").trim(),
        ),
      ),
    ]
      .filter(Boolean)
      .sort();
    const cacheKey = [
      request.data.topic.normalize("NFKC").toLocaleLowerCase("en-US").trim(),
      request.data.level,
      String(request.data.requestedCount),
      initiallyExcluded.join(","),
    ].join(":");
    const cached = this.cache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) return cached.value;
    if (cached) this.cache.delete(cacheKey);
    const fetcher = this.options.fetch ?? globalThis.fetch;
    const candidates: LocalVocabularySet["candidates"] = [];
    let title = `${request.data.topic} vocabulary`;
    while (candidates.length < request.data.requestedCount) {
      const batchCount = Math.min(20, request.data.requestedCount - candidates.length);
      let batch: LocalVocabularySet | undefined;
      for (let attempt = 0; attempt < 2 && !batch; attempt += 1) {
        try {
          batch = await this.generateBatch(
            request.data,
            batchCount,
            [...initiallyExcluded, ...candidates.map(({ term }) => term)],
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
    const value = { title, candidates };
    this.cache.set(cacheKey, { expiresAt: Date.now() + CACHE_TTL_MS, value });
    while (this.cache.size > CACHE_MAX_ENTRIES) {
      const oldest = this.cache.keys().next().value;
      if (oldest === undefined) break;
      this.cache.delete(oldest);
    }
    return value;
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
          format: suggestionFormat(batchCount),
          options: { temperature: 0.2, num_predict: 96 + batchCount * 32 },
          messages: [
            {
              role: "system",
              content: `You suggest useful English vocabulary candidates. Return JSON only. Apply CEFR strictly to vocabulary difficulty. Never provide definitions, examples, exercises, pronunciation, or other facts.`,
            },
            {
              role: "user",
              content: `Suggest exactly ${String(batchCount)} unique ${request.level} English terms about ${request.topic}. ${cefrGuidance[request.level]} Prefer useful single-word dictionary headwords; use a multiword term only when it is an established lexical entry. Return {candidates:[{term,type}]}. Avoid these existing terms: ${excludedTerms.length ? excludedTerms.join(", ") : "none"}. Balance useful word classes and expressions.`,
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
    const result = suggestionSetSchema.safeParse(decoded);
    if (!result.success || result.data.candidates.length !== batchCount)
      throw new OllamaVocabularyError("INVALID_OUTPUT");
    const terms = result.data.candidates.map(({ term }) => term.toLocaleLowerCase("en-US"));
    const excluded = new Set(
      excludedTerms.map((term) => term.normalize("NFKC").toLocaleLowerCase("en-US").trim()),
    );
    if (new Set(terms).size !== terms.length || terms.some((term) => excluded.has(term)))
      throw new OllamaVocabularyError("INVALID_OUTPUT");
    return {
      title: `${request.topic} vocabulary`,
      candidates: result.data.candidates.map((candidate) => ({
        ...candidate,
        meaning: PENDING_MEANING,
        example: PENDING_EXAMPLE,
        challenge: PENDING_CHALLENGE,
      })),
    };
  }
}
