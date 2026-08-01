import { describe, expect, it } from "vitest";
import { confirmCollection, createCollectionDraft } from "./collection.js";
import {
  ChallengeGenerationError,
  generateTrainingChallenges,
  type ChallengeGenerationRequest,
} from "./challenges.js";

const candidates = [
  {
    id: "candidate_1",
    englishTerm: "pitch",
    sourceLanguage: "en",
    sense: "playing surface",
    partOfSpeech: "noun" as const,
    sourceContext: "football match",
    status: "proposed" as const,
  },
  {
    id: "candidate_2",
    englishTerm: "pass",
    sourceLanguage: "en",
    sense: "send the ball",
    partOfSpeech: "verb" as const,
    sourceContext: "football match",
    status: "proposed" as const,
  },
];
const draft = createCollectionDraft({
  id: "collection_1",
  ownerId: "learner_1",
  title: "Football",
  level: "B1",
  source: { type: "topic", topic: "football", requestedCount: 2 },
  candidates,
});
const confirmed = confirmCollection(
  draft,
  candidates.map(({ id }) => id),
);
class Generator {
  readonly requests: ChallengeGenerationRequest[] = [];
  constructor(private readonly override?: unknown) {}
  generate(request: ChallengeGenerationRequest): Promise<unknown> {
    this.requests.push(structuredClone(request));
    return Promise.resolve(
      this.override ??
        request.candidates.map((candidate, index) => ({
          id: `challenge_${String(index + 1)}`,
          candidateId: candidate.id,
          kind: index === 0 ? "recall" : "cloze",
          prompt: `Use the meaning: ${candidate.sense}`,
          expectedAnswer: candidate.englishTerm,
          explanation: `${candidate.englishTerm} means ${candidate.sense}.`,
          context: candidate.sourceContext ?? "realistic conversation",
        })),
    );
  }
}
describe("contextual challenge generation", () => {
  it("uses approved terms with their sense and context", async () => {
    const generator = new Generator();
    const challenges = await generateTrainingChallenges(confirmed, generator);
    expect(challenges).toHaveLength(2);
    expect(generator.requests[0]?.candidates).toEqual(
      candidates.map(({ id, englishTerm, sense, sourceContext }) => ({
        id,
        englishTerm,
        sense,
        sourceContext,
      })),
    );
  });
  it("rejects draft and empty approved collections", async () => {
    await expect(generateTrainingChallenges(draft, new Generator())).rejects.toEqual(
      new ChallengeGenerationError("COLLECTION_NOT_CONFIRMED"),
    );
    const firstCandidate = candidates[0];
    if (!firstCandidate) throw new Error("missing candidate fixture");
    const noneApproved = confirmCollection(draft, [firstCandidate.id]);
    const altered = {
      ...noneApproved,
      candidates: noneApproved.candidates.map((item) => ({ ...item, status: "rejected" as const })),
    };
    await expect(generateTrainingChallenges(altered, new Generator())).rejects.toEqual(
      new ChallengeGenerationError("NO_APPROVED_CANDIDATES"),
    );
  });
  it.each([
    { invalid: true },
    [],
    [
      {
        id: "challenge_1",
        candidateId: "unknown",
        kind: "recall",
        prompt: "Prompt",
        expectedAnswer: "answer",
        explanation: "Explanation",
        context: "Context",
      },
    ],
  ])("rejects invalid, incomplete, or unknown challenge output", async (output) => {
    await expect(generateTrainingChallenges(confirmed, new Generator(output))).rejects.toEqual(
      new ChallengeGenerationError("INVALID_CHALLENGES"),
    );
  });
});
