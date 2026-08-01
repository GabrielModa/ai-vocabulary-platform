import {
  vocabularyCandidateSchema,
  vocabularyCollectionSchema,
  type CreateCollectionDraft,
  type VocabularyCandidate,
  type VocabularyCollection,
} from "./model.js";

export type VocabularyDomainErrorCode =
  "COLLECTION_CONFIRMED" | "DUPLICATE_CANDIDATE" | "INVALID_COLLECTION" | "INVALID_SELECTION";

export class VocabularyDomainError extends Error {
  constructor(readonly code: VocabularyDomainErrorCode) {
    super(`Vocabulary operation failed: ${code}`);
    this.name = "VocabularyDomainError";
  }
}

function duplicateKey(candidate: VocabularyCandidate): string {
  return `${candidate.englishTerm.toLocaleLowerCase("en-US")}::${candidate.sense.toLocaleLowerCase("en-US")}`;
}

function assertNoDuplicates(candidates: readonly VocabularyCandidate[]): void {
  const keys = new Set<string>();
  for (const candidate of candidates) {
    const key = duplicateKey(candidate);
    if (keys.has(key)) throw new VocabularyDomainError("DUPLICATE_CANDIDATE");
    keys.add(key);
  }
}

function parseCollection(input: unknown): VocabularyCollection {
  const result = vocabularyCollectionSchema.safeParse(input);
  if (!result.success) throw new VocabularyDomainError("INVALID_COLLECTION");
  assertNoDuplicates(result.data.candidates);
  return Object.freeze(result.data);
}

export function createCollectionDraft(input: CreateCollectionDraft): VocabularyCollection {
  return parseCollection({ ...input, status: "draft", candidates: input.candidates ?? [] });
}

export function upsertCandidate(
  collection: VocabularyCollection,
  candidateInput: VocabularyCandidate,
): VocabularyCollection {
  if (collection.status !== "draft") throw new VocabularyDomainError("COLLECTION_CONFIRMED");
  const parsed = vocabularyCandidateSchema.safeParse(candidateInput);
  if (!parsed.success) throw new VocabularyDomainError("INVALID_COLLECTION");
  const candidate = { ...parsed.data, status: "proposed" as const };
  const existingIndex = collection.candidates.findIndex((item) => item.id === candidate.id);
  const candidates = [...collection.candidates];
  if (existingIndex === -1) candidates.push(candidate);
  else candidates[existingIndex] = candidate;
  return parseCollection({ ...collection, candidates });
}

export function confirmCollection(
  collection: VocabularyCollection,
  selectedCandidateIds: readonly string[],
): VocabularyCollection {
  if (collection.status !== "draft") throw new VocabularyDomainError("COLLECTION_CONFIRMED");
  const selected = new Set(selectedCandidateIds);
  if (selected.size === 0 || selected.size !== selectedCandidateIds.length) {
    throw new VocabularyDomainError("INVALID_SELECTION");
  }
  const knownIds = new Set(collection.candidates.map((candidate) => candidate.id));
  if ([...selected].some((id) => !knownIds.has(id))) {
    throw new VocabularyDomainError("INVALID_SELECTION");
  }
  return parseCollection({
    ...collection,
    status: "confirmed",
    candidates: collection.candidates.map((candidate) => ({
      ...candidate,
      status: selected.has(candidate.id) ? "approved" : "rejected",
    })),
  });
}

export function isTrainingEligible(collection: VocabularyCollection): boolean {
  return (
    collection.status === "confirmed" &&
    collection.candidates.some((candidate) => candidate.status === "approved")
  );
}
