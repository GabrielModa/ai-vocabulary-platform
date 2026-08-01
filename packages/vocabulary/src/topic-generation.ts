import { z } from "zod";
import { createCollectionDraft } from "./collection.js";
import {
  cefrLevelSchema,
  partOfSpeechSchema,
  type CefrLevel,
  type VocabularyCollection,
} from "./model.js";
import type { CandidateIdFactory } from "./typed-input.js";

const balancedCategories = [
  "noun",
  "verb",
  "adjective",
  "collocation",
  "phrasal-verb",
  "expression",
] as const;
const topicRequestSchema = z.object({
  topic: z.string().trim().min(2).max(200),
  requestedCount: z.number().int().min(1).max(100),
  level: cefrLevelSchema,
});
const generatedCandidatesSchema = z.array(
  z.object({
    englishTerm: z.string().trim().min(1).max(200),
    sense: z.string().trim().min(1).max(500),
    partOfSpeech: partOfSpeechSchema,
    sourceContext: z.string().trim().min(1).max(1_000).optional(),
  }),
);

export interface TopicCandidateGenerationRequest {
  readonly topic: string;
  readonly requestedCount: number;
  readonly level: CefrLevel;
  readonly requiredCategories: readonly (typeof balancedCategories)[number][];
}
export interface TopicCandidateGenerator {
  generate(request: TopicCandidateGenerationRequest): Promise<unknown>;
}
export interface CreateTopicCollectionRequest {
  readonly collectionId: string;
  readonly ownerId: string;
  readonly title: string;
  readonly topic: string;
  readonly requestedCount: number;
  readonly level: CefrLevel;
}
export interface TopicGenerationDependencies {
  readonly generator: TopicCandidateGenerator;
  readonly candidateIds: CandidateIdFactory;
}
export type TopicGenerationErrorCode =
  | "INVALID_REQUEST"
  | "INVALID_GENERATION"
  | "COUNT_MISMATCH"
  | "DUPLICATE_GENERATION"
  | "UNBALANCED_GENERATION";
export class TopicGenerationError extends Error {
  constructor(readonly code: TopicGenerationErrorCode) {
    super(`Topic vocabulary generation failed: ${code}`);
    this.name = "TopicGenerationError";
  }
}
export function requiredTopicCategories(
  requestedCount: number,
): readonly (typeof balancedCategories)[number][] {
  return balancedCategories.slice(0, Math.min(requestedCount, balancedCategories.length));
}
function normalizedKey(englishTerm: string, sense: string): string {
  return `${englishTerm.normalize("NFKC").toLocaleLowerCase("en-US").trim()}::${sense.normalize("NFKC").toLocaleLowerCase("en-US").trim()}`;
}
export async function createTopicCollection(
  request: CreateTopicCollectionRequest,
  dependencies: TopicGenerationDependencies,
): Promise<VocabularyCollection> {
  const parsedRequest = topicRequestSchema.safeParse(request);
  if (!parsedRequest.success) throw new TopicGenerationError("INVALID_REQUEST");
  const requiredCategories = requiredTopicCategories(parsedRequest.data.requestedCount);
  const generated = generatedCandidatesSchema.safeParse(
    await dependencies.generator.generate({ ...parsedRequest.data, requiredCategories }),
  );
  if (!generated.success) throw new TopicGenerationError("INVALID_GENERATION");
  if (generated.data.length !== parsedRequest.data.requestedCount)
    throw new TopicGenerationError("COUNT_MISMATCH");
  const keys = generated.data.map((item) => normalizedKey(item.englishTerm, item.sense));
  if (new Set(keys).size !== keys.length) throw new TopicGenerationError("DUPLICATE_GENERATION");
  const presentCategories = new Set(generated.data.map((item) => item.partOfSpeech));
  if (requiredCategories.some((category) => !presentCategories.has(category)))
    throw new TopicGenerationError("UNBALANCED_GENERATION");
  return createCollectionDraft({
    id: request.collectionId,
    ownerId: request.ownerId,
    title: request.title,
    level: parsedRequest.data.level,
    source: {
      type: "topic",
      topic: parsedRequest.data.topic,
      requestedCount: parsedRequest.data.requestedCount,
    },
    candidates: generated.data.map((candidate) => ({
      id: dependencies.candidateIds.next(),
      ...candidate,
      sourceLanguage: "en",
      sourceContext: candidate.sourceContext ?? parsedRequest.data.topic,
      status: "proposed",
    })),
  });
}
