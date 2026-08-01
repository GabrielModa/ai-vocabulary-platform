import { z } from "zod";

const identifier = z.string().trim().min(1).max(128);
const boundedText = z.string().trim().min(1).max(10_000);
export const cefrLevelSchema = z.enum(["A2", "B1", "B2", "C1", "C2"]);
export const partOfSpeechSchema = z.enum([
  "noun",
  "verb",
  "adjective",
  "adverb",
  "collocation",
  "phrasal-verb",
  "expression",
  "other",
]);

export const collectionSourceSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("text"), text: boundedText, language: identifier }),
  z.object({
    type: z.literal("topic"),
    topic: z.string().trim().min(2).max(200),
    requestedCount: z.number().int().min(1).max(100),
  }),
  z.object({
    type: z.literal("photo"),
    mediaReference: identifier,
    context: z.string().trim().max(1_000).optional(),
  }),
]);

export const vocabularyCandidateSchema = z.object({
  id: identifier,
  englishTerm: z.string().trim().min(1).max(200),
  sourceTerm: z.string().trim().min(1).max(200).optional(),
  sourceLanguage: identifier,
  sense: z.string().trim().min(1).max(500),
  partOfSpeech: partOfSpeechSchema,
  sourceContext: z.string().trim().min(1).max(1_000).optional(),
  status: z.enum(["proposed", "approved", "rejected"]),
});

export const vocabularyCollectionSchema = z.object({
  id: identifier,
  ownerId: identifier,
  title: z.string().trim().min(1).max(200),
  level: cefrLevelSchema,
  source: collectionSourceSchema,
  status: z.enum(["draft", "confirmed"]),
  candidates: z.array(vocabularyCandidateSchema).max(100),
});

export type CefrLevel = z.infer<typeof cefrLevelSchema>;
export type CollectionSource = z.infer<typeof collectionSourceSchema>;
export type VocabularyCandidate = z.infer<typeof vocabularyCandidateSchema>;
export type VocabularyCollection = z.infer<typeof vocabularyCollectionSchema>;

export interface CreateCollectionDraft {
  readonly id: string;
  readonly ownerId: string;
  readonly title: string;
  readonly level: CefrLevel;
  readonly source: CollectionSource;
  readonly candidates?: readonly VocabularyCandidate[];
}
