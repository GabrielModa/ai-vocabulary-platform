import { confirmCollection, upsertCandidate } from "./collection.js";
import type { VocabularyCandidate, VocabularyCollection } from "./model.js";

export interface VocabularyCollectionReader {
  findById(id: string): Promise<VocabularyCollection | undefined>;
}
export type LearnerIdentity =
  { readonly kind: "anonymous" } | { readonly kind: "learner"; readonly subjectId: string };
export type ReviewErrorCode = "UNAUTHENTICATED" | "NOT_FOUND" | "FORBIDDEN";
export class ReviewError extends Error {
  constructor(readonly code: ReviewErrorCode) {
    super(`Vocabulary review failed: ${code}`);
    this.name = "ReviewError";
  }
}
async function ownedCollection(
  identity: LearnerIdentity,
  collectionId: string,
  reader: VocabularyCollectionReader,
): Promise<VocabularyCollection> {
  if (identity.kind === "anonymous") throw new ReviewError("UNAUTHENTICATED");
  const collection = await reader.findById(collectionId);
  if (!collection) throw new ReviewError("NOT_FOUND");
  if (collection.ownerId !== identity.subjectId) throw new ReviewError("FORBIDDEN");
  return collection;
}
export async function editCandidate(
  identity: LearnerIdentity,
  collectionId: string,
  candidate: VocabularyCandidate,
  reader: VocabularyCollectionReader,
): Promise<VocabularyCollection> {
  return upsertCandidate(await ownedCollection(identity, collectionId, reader), candidate);
}
export async function confirmReviewedCollection(
  identity: LearnerIdentity,
  collectionId: string,
  selectedCandidateIds: readonly string[],
  reader: VocabularyCollectionReader,
): Promise<VocabularyCollection> {
  return confirmCollection(
    await ownedCollection(identity, collectionId, reader),
    selectedCandidateIds,
  );
}
