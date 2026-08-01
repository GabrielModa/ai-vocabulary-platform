import { z } from "zod";
import { createCollectionDraft, VocabularyDomainError } from "./collection.js";
import {
  cefrLevelSchema,
  partOfSpeechSchema,
  type CefrLevel,
  type VocabularyCollection,
} from "./model.js";

const MAX_ENTRIES = 100;
const MAX_TERM_LENGTH = 200;

export interface LanguageDetector {
  detect(text: string): Promise<string>;
}

export interface TypedCandidateAnalysisRequest {
  readonly entries: readonly string[];
  readonly detectedLanguage: string;
  readonly level: CefrLevel;
}

export interface TypedCandidateAnalyzer {
  analyze(request: TypedCandidateAnalysisRequest): Promise<unknown>;
}

export interface CandidateIdFactory {
  next(): string;
}

export interface CreateTypedCollectionRequest {
  readonly collectionId: string;
  readonly ownerId: string;
  readonly title: string;
  readonly text: string;
  readonly level: CefrLevel;
  readonly language?: string;
}

export interface TypedCandidatePipelineDependencies {
  readonly languageDetector: LanguageDetector;
  readonly analyzer: TypedCandidateAnalyzer;
  readonly candidateIds: CandidateIdFactory;
}

export type TypedInputErrorCode =
  "EMPTY_INPUT" | "INPUT_TOO_LARGE" | "INVALID_ANALYSIS" | "INVALID_LANGUAGE";

export class TypedInputError extends Error {
  constructor(readonly code: TypedInputErrorCode) {
    super(`Typed vocabulary input failed: ${code}`);
    this.name = "TypedInputError";
  }
}

const analysisSchema = z.array(
  z.object({
    sourceTerm: z.string().trim().min(1).max(MAX_TERM_LENGTH),
    englishTerm: z.string().trim().min(1).max(MAX_TERM_LENGTH),
    sourceLanguage: z.string().trim().min(1).max(128),
    sense: z.string().trim().min(1).max(500),
    partOfSpeech: partOfSpeechSchema,
    sourceContext: z.string().trim().min(1).max(1_000).optional(),
  }),
);

function normalizedKey(value: string): string {
  return value.normalize("NFKC").toLocaleLowerCase().replace(/\s+/gu, " ").trim();
}

export function parseTypedEntries(text: string): readonly string[] {
  const rawEntries = text.split(/[,;\n\r]+/u).map((entry) => entry.replace(/\s+/gu, " ").trim());
  const entries: string[] = [];
  const seen = new Set<string>();
  for (const entry of rawEntries) {
    if (!entry) continue;
    if (entry.length > MAX_TERM_LENGTH) throw new TypedInputError("INPUT_TOO_LARGE");
    const key = normalizedKey(entry);
    if (!seen.has(key)) entries.push(entry);
    seen.add(key);
  }
  if (entries.length === 0) throw new TypedInputError("EMPTY_INPUT");
  if (entries.length > MAX_ENTRIES) throw new TypedInputError("INPUT_TOO_LARGE");
  return Object.freeze(entries);
}

export async function createTypedCollection(
  request: CreateTypedCollectionRequest,
  dependencies: TypedCandidatePipelineDependencies,
): Promise<VocabularyCollection> {
  const level = cefrLevelSchema.safeParse(request.level);
  if (!level.success) throw new VocabularyDomainError("INVALID_COLLECTION");
  const entries = parseTypedEntries(request.text);
  const detectedLanguage =
    request.language ?? (await dependencies.languageDetector.detect(request.text));
  if (!/^[-A-Za-z0-9]{2,35}$/u.test(detectedLanguage)) {
    throw new TypedInputError("INVALID_LANGUAGE");
  }
  const analyzed = analysisSchema.safeParse(
    await dependencies.analyzer.analyze({ entries, detectedLanguage, level: level.data }),
  );
  if (
    !analyzed.success ||
    analyzed.data.length !== entries.length ||
    analyzed.data.some((candidate, index) => candidate.sourceTerm !== entries[index])
  ) {
    throw new TypedInputError("INVALID_ANALYSIS");
  }
  return createCollectionDraft({
    id: request.collectionId,
    ownerId: request.ownerId,
    title: request.title,
    level: level.data,
    source: { type: "text", text: request.text, language: detectedLanguage },
    candidates: analyzed.data.map((candidate) => ({
      id: dependencies.candidateIds.next(),
      ...candidate,
      status: "proposed",
    })),
  });
}
