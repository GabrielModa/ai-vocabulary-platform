import { describe, expect, it, vi } from "vitest";
import { SequentialCandidateIdFactory } from "./testing.js";
import { createPhotoCollection, PhotoIngestionError } from "./photo-ingestion.js";

const request = {
  collectionId: "photo_1",
  ownerId: "learner_1",
  title: "Photo words",
  mediaReference: "temporary/photo-1",
  mimeType: "image/jpeg" as const,
  byteSize: 1024,
  processingConsent: true,
  context: "school page",
  level: "A2" as const,
};
function dependencies(options: { safe?: boolean; output?: unknown; deleteFails?: boolean } = {}) {
  const deleted: string[] = [];
  return {
    deleted,
    scanner: { isSafe: vi.fn().mockResolvedValue(options.safe ?? true) },
    extractor: {
      extract: vi.fn().mockResolvedValue(
        options.output ?? [
          {
            englishTerm: "book",
            sourceLanguage: "en",
            sense: "written work",
            partOfSpeech: "noun",
          },
        ],
      ),
    },
    mediaStore: {
      delete: vi.fn((reference: string) => {
        deleted.push(reference);
        return options.deleteFails
          ? Promise.reject(new Error("storage details"))
          : Promise.resolve();
      }),
    },
    candidateIds: new SequentialCandidateIdFactory(),
  };
}
describe("privacy-safe photo ingestion", () => {
  it("scans, extracts proposed candidates, and deletes temporary media", async () => {
    const ports = dependencies();
    const collection = await createPhotoCollection(request, ports);
    expect(ports.scanner.isSafe).toHaveBeenCalledWith(request.mediaReference);
    expect(collection.candidates[0]?.status).toBe("proposed");
    expect(collection.status).toBe("draft");
    expect(ports.deleted).toEqual([request.mediaReference]);
  });
  it("requires explicit consent before accessing media", async () => {
    const ports = dependencies();
    await expect(
      createPhotoCollection({ ...request, processingConsent: false }, ports),
    ).rejects.toEqual(new PhotoIngestionError("CONSENT_REQUIRED"));
    expect(ports.scanner.isSafe).not.toHaveBeenCalled();
  });
  it.each([
    { mimeType: "image/gif", byteSize: 10 },
    { mimeType: "image/jpeg", byteSize: 10 * 1024 * 1024 + 1 },
  ])("rejects invalid media metadata", async (input) => {
    await expect(
      createPhotoCollection({ ...request, ...input } as typeof request, dependencies()),
    ).rejects.toEqual(new PhotoIngestionError("INVALID_PHOTO"));
  });
  it("deletes unsafe media and returns a safe error", async () => {
    const ports = dependencies({ safe: false });
    await expect(createPhotoCollection(request, ports)).rejects.toEqual(
      new PhotoIngestionError("UNSAFE_PHOTO"),
    );
    expect(ports.deleted).toEqual([request.mediaReference]);
  });
  it("deletes media after invalid extraction", async () => {
    const ports = dependencies({ output: { private: "extracted text" } });
    await expect(createPhotoCollection(request, ports)).rejects.toEqual(
      new PhotoIngestionError("INVALID_EXTRACTION"),
    );
    expect(ports.deleted).toEqual([request.mediaReference]);
  });
  it("fails closed when temporary media cannot be deleted", async () => {
    await expect(
      createPhotoCollection(request, dependencies({ deleteFails: true })),
    ).rejects.toEqual(new PhotoIngestionError("MEDIA_CLEANUP_FAILED"));
  });
});
