import { vocabularyCollectionSchema, type VocabularyCollection } from "./model.js";

export interface StoredVocabularyCollection {
  readonly collection: VocabularyCollection;
  readonly version: number;
}
export interface VocabularyCollectionRepository {
  create(collection: VocabularyCollection): Promise<StoredVocabularyCollection>;
  findOwned(ownerId: string, collectionId: string): Promise<StoredVocabularyCollection | undefined>;
  save(
    collection: VocabularyCollection,
    expectedVersion: number,
  ): Promise<StoredVocabularyCollection>;
}
export type RepositoryErrorCode =
  "ALREADY_EXISTS" | "NOT_FOUND" | "STALE_VERSION" | "INVALID_COLLECTION";
export class RepositoryError extends Error {
  constructor(readonly code: RepositoryErrorCode) {
    super(`Vocabulary persistence failed: ${code}`);
    this.name = "RepositoryError";
  }
}
function clone(collection: VocabularyCollection): VocabularyCollection {
  const parsed = vocabularyCollectionSchema.safeParse(structuredClone(collection));
  if (!parsed.success) throw new RepositoryError("INVALID_COLLECTION");
  return parsed.data;
}
export class InMemoryVocabularyCollectionRepository implements VocabularyCollectionRepository {
  readonly #items = new Map<string, StoredVocabularyCollection>();
  create(collection: VocabularyCollection): Promise<StoredVocabularyCollection> {
    if (this.#items.has(collection.id))
      return Promise.reject(new RepositoryError("ALREADY_EXISTS"));
    const stored = { collection: clone(collection), version: 1 };
    this.#items.set(collection.id, stored);
    return Promise.resolve({ collection: clone(stored.collection), version: stored.version });
  }
  findOwned(
    ownerId: string,
    collectionId: string,
  ): Promise<StoredVocabularyCollection | undefined> {
    const stored = this.#items.get(collectionId);
    return Promise.resolve(
      stored?.collection.ownerId === ownerId
        ? { collection: clone(stored.collection), version: stored.version }
        : undefined,
    );
  }
  save(
    collection: VocabularyCollection,
    expectedVersion: number,
  ): Promise<StoredVocabularyCollection> {
    const current = this.#items.get(collection.id);
    if (current?.collection.ownerId !== collection.ownerId)
      return Promise.reject(new RepositoryError("NOT_FOUND"));
    if (current.version !== expectedVersion)
      return Promise.reject(new RepositoryError("STALE_VERSION"));
    const stored = { collection: clone(collection), version: current.version + 1 };
    this.#items.set(collection.id, stored);
    return Promise.resolve({ collection: clone(stored.collection), version: stored.version });
  }
  findById(id: string): Promise<VocabularyCollection | undefined> {
    const stored = this.#items.get(id);
    return Promise.resolve(stored?.collection ? clone(stored.collection) : undefined);
  }
}
