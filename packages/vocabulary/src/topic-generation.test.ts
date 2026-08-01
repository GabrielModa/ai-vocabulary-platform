import { describe, expect, it } from "vitest";
import { DeterministicTopicCandidateGenerator, SequentialCandidateIdFactory } from "./testing.js";
import {
  createTopicCollection,
  requiredTopicCategories,
  TopicGenerationError,
} from "./topic-generation.js";

function dependencies(outputOverride?: unknown) {
  return {
    generator: new DeterministicTopicCandidateGenerator(outputOverride),
    candidateIds: new SequentialCandidateIdFactory(),
  };
}
const baseRequest = {
  collectionId: "collection_football",
  ownerId: "learner_1",
  title: "Football words",
  topic: "  football  ",
  requestedCount: 6,
  level: "B1" as const,
};

describe("topic collection generation", () => {
  it("requests normalized topic, exact count, level, and category coverage", async () => {
    const ports = dependencies();
    const collection = await createTopicCollection(baseRequest, ports);
    expect(ports.generator.requests).toEqual([
      {
        topic: "football",
        requestedCount: 6,
        level: "B1",
        requiredCategories: [
          "noun",
          "verb",
          "adjective",
          "collocation",
          "phrasal-verb",
          "expression",
        ],
      },
    ]);
    expect(collection.source).toEqual({ type: "topic", topic: "football", requestedCount: 6 });
    expect(collection.candidates).toHaveLength(6);
    expect(collection.candidates.every((candidate) => candidate.status === "proposed")).toBe(true);
    expect(collection.status).toBe("draft");
  });
  it("scales required category coverage to the requested count", () => {
    expect(requiredTopicCategories(1)).toEqual(["noun"]);
    expect(requiredTopicCategories(3)).toEqual(["noun", "verb", "adjective"]);
    expect(requiredTopicCategories(30)).toEqual([
      "noun",
      "verb",
      "adjective",
      "collocation",
      "phrasal-verb",
      "expression",
    ]);
  });
  it.each([0, 101, 1.5])("rejects invalid requested count %s", async (requestedCount) => {
    await expect(
      createTopicCollection({ ...baseRequest, requestedCount }, dependencies()),
    ).rejects.toEqual(new TopicGenerationError("INVALID_REQUEST"));
  });
  it("rejects an invalid topic without exposing it in the error", async () => {
    const privateTopic = "x";
    try {
      await createTopicCollection({ ...baseRequest, topic: privateTopic }, dependencies());
    } catch (error) {
      expect(String(error)).toBe(
        "TopicGenerationError: Topic vocabulary generation failed: INVALID_REQUEST",
      );
      expect(String(error)).not.toContain(privateTopic);
    }
  });
  it.each([
    { name: "invalid", output: { candidates: [] }, code: "INVALID_GENERATION" },
    { name: "too few", output: [], code: "COUNT_MISMATCH" },
    {
      name: "duplicate",
      output: Array.from({ length: 6 }, () => ({
        englishTerm: "pitch",
        sense: "playing surface",
        partOfSpeech: "noun",
      })),
      code: "DUPLICATE_GENERATION",
    },
    {
      name: "unbalanced",
      output: Array.from({ length: 6 }, (_, index) => ({
        englishTerm: `football noun ${String(index + 1)}`,
        sense: `sense ${String(index + 1)}`,
        partOfSpeech: "noun",
      })),
      code: "UNBALANCED_GENERATION",
    },
  ])("rejects $name generator output", async ({ output, code }) => {
    await expect(createTopicCollection(baseRequest, dependencies(output))).rejects.toMatchObject({
      code,
    });
  });
  it("is deterministic for the same request and fake configuration", async () => {
    expect(await createTopicCollection(baseRequest, dependencies())).toEqual(
      await createTopicCollection(baseRequest, dependencies()),
    );
  });
});
