import { z } from "zod";
import { createCollectionDraft } from "./collection.js";
import {
  cefrLevelSchema,
  partOfSpeechSchema,
  type CefrLevel,
  type VocabularyCollection,
} from "./model.js";
import type { CandidateIdFactory } from "./typed-input.js";

const MAX_PHOTO_BYTES = 10 * 1024 * 1024;
const photoRequestSchema = z.object({
  mediaReference: z.string().trim().min(1).max(128),
  mimeType: z.enum(["image/jpeg", "image/png", "image/webp"]),
  byteSize: z.number().int().positive().max(MAX_PHOTO_BYTES),
  context: z.string().trim().max(1_000).optional(),
  processingConsent: z.literal(true),
  level: cefrLevelSchema,
});
const extractionSchema = z
  .array(
    z.object({
      englishTerm: z.string().trim().min(1).max(200),
      sourceTerm: z.string().trim().min(1).max(200).optional(),
      sourceLanguage: z.string().trim().min(1).max(128),
      sense: z.string().trim().min(1).max(500),
      partOfSpeech: partOfSpeechSchema,
      sourceContext: z.string().trim().min(1).max(1_000).optional(),
    }),
  )
  .min(1)
  .max(100);

export interface PhotoSafetyScanner {
  isSafe(mediaReference: string): Promise<boolean>;
}
export interface PhotoCandidateExtractor {
  extract(request: {
    readonly mediaReference: string;
    readonly level: CefrLevel;
    readonly context?: string;
  }): Promise<unknown>;
}
export interface TemporaryMediaStore {
  delete(mediaReference: string): Promise<void>;
}
export interface CreatePhotoCollectionRequest {
  readonly collectionId: string;
  readonly ownerId: string;
  readonly title: string;
  readonly mediaReference: string;
  readonly mimeType: "image/jpeg" | "image/png" | "image/webp";
  readonly byteSize: number;
  readonly processingConsent: boolean;
  readonly context?: string;
  readonly level: CefrLevel;
}
export interface PhotoIngestionDependencies {
  readonly scanner: PhotoSafetyScanner;
  readonly extractor: PhotoCandidateExtractor;
  readonly mediaStore: TemporaryMediaStore;
  readonly candidateIds: CandidateIdFactory;
}
export type PhotoIngestionErrorCode =
  | "INVALID_PHOTO"
  | "CONSENT_REQUIRED"
  | "UNSAFE_PHOTO"
  | "INVALID_EXTRACTION"
  | "MEDIA_CLEANUP_FAILED";
export class PhotoIngestionError extends Error {
  constructor(readonly code: PhotoIngestionErrorCode) {
    super(`Photo vocabulary ingestion failed: ${code}`);
    this.name = "PhotoIngestionError";
  }
}
export async function createPhotoCollection(
  request: CreatePhotoCollectionRequest,
  dependencies: PhotoIngestionDependencies,
): Promise<VocabularyCollection> {
  if (!request.processingConsent) throw new PhotoIngestionError("CONSENT_REQUIRED");
  const parsed = photoRequestSchema.safeParse(request);
  if (!parsed.success) throw new PhotoIngestionError("INVALID_PHOTO");
  let result: VocabularyCollection | undefined;
  let failure: unknown;
  try {
    if (!(await dependencies.scanner.isSafe(parsed.data.mediaReference)))
      throw new PhotoIngestionError("UNSAFE_PHOTO");
    const extracted = extractionSchema.safeParse(
      await dependencies.extractor.extract({
        mediaReference: parsed.data.mediaReference,
        level: parsed.data.level,
        ...(parsed.data.context === undefined ? {} : { context: parsed.data.context }),
      }),
    );
    if (!extracted.success) throw new PhotoIngestionError("INVALID_EXTRACTION");
    result = createCollectionDraft({
      id: request.collectionId,
      ownerId: request.ownerId,
      title: request.title,
      level: parsed.data.level,
      source: {
        type: "photo",
        mediaReference: parsed.data.mediaReference,
        context: parsed.data.context,
      },
      candidates: extracted.data.map((candidate) => ({
        id: dependencies.candidateIds.next(),
        ...candidate,
        status: "proposed",
      })),
    });
  } catch (error) {
    failure = error;
  }
  try {
    await dependencies.mediaStore.delete(parsed.data.mediaReference);
  } catch {
    throw new PhotoIngestionError("MEDIA_CLEANUP_FAILED");
  }
  if (failure instanceof Error) throw failure;
  if (failure !== undefined) throw new PhotoIngestionError("INVALID_EXTRACTION");
  if (!result) throw new PhotoIngestionError("INVALID_EXTRACTION");
  return result;
}
