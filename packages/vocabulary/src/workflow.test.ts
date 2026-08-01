import { describe, expect, it } from "vitest";
import { type ChallengeGenerationRequest } from "./challenges.js";
import { InMemoryVocabularyCollectionRepository } from "./repository.js";
import { DeterministicTopicCandidateGenerator, SequentialCandidateIdFactory } from "./testing.js";
import { runTopicVocabularyLoop, VocabularyLoopError } from "./workflow.js";

const request = {
  collectionId: "collection_football",
  ownerId: "learner_1",
  title: "Football",
  topic: "football",
  requestedCount: 3,
  level: "B1" as const,
  sessionId: "session_1",
  answers: ["football term 1", "wrong", "football term 3"],
};
function dependencies() {
  const repository = new InMemoryVocabularyCollectionRepository();
  const challengeRequests: ChallengeGenerationRequest[] = [];
  return {
    repository,
    challengeRequests,
    candidateIds: new SequentialCandidateIdFactory(),
    generator: new DeterministicTopicCandidateGenerator(),
    challengeGenerator: {
      generate(generationRequest: ChallengeGenerationRequest): Promise<unknown> {
        challengeRequests.push(structuredClone(generationRequest));
        return Promise.resolve(
          generationRequest.candidates.map((candidate, index) => ({
            id: `challenge_${String(index + 1)}`,
            candidateId: candidate.id,
            kind: index % 2 === 0 ? "recall" : "cloze",
            prompt: `Retrieve ${candidate.sense} in context.`,
            expectedAnswer: candidate.englishTerm,
            explanation: `${candidate.englishTerm}: ${candidate.sense}`,
            context: candidate.sourceContext ?? "football",
          })),
        );
      },
    },
  };
}
describe("end-to-end vocabulary loop", () => {
  it("preserves capture, review, persistence, context, and retrieval results", async () => {
    const ports = dependencies();
    const completed = await runTopicVocabularyLoop(request, ports);
    expect(completed).toMatchObject({
      collectionId: request.collectionId,
      collectionVersion: 2,
      score: { correct: 2, attempted: 3 },
    });
    expect(completed.session.status).toBe("completed");
    const stored = await ports.repository.findOwned(request.ownerId, request.collectionId);
    expect(stored?.collection).toMatchObject({
      level: "B1",
      status: "confirmed",
      source: { type: "topic", topic: "football", requestedCount: 3 },
    });
    expect(
      stored?.collection.candidates.every((candidate) => candidate.status === "approved"),
    ).toBe(true);
    expect(
      ports.challengeRequests[0]?.candidates.every(
        (candidate) => candidate.sourceContext === "football",
      ),
    ).toBe(true);
  });
  it("fails safely when the journey lacks one answer per challenge", async () => {
    await expect(
      runTopicVocabularyLoop({ ...request, answers: ["one"] }, dependencies()),
    ).rejects.toEqual(new VocabularyLoopError("ANSWER_COUNT_MISMATCH"));
  });
});
