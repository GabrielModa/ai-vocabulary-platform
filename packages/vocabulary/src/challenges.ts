import { z } from "zod";
import type { VocabularyCollection } from "./model.js";

const challengeKindSchema = z.enum(["recall", "cloze", "context-choice"]);
export const trainingChallengeSchema = z.object({
  id: z.string().trim().min(1).max(128),
  candidateId: z.string().trim().min(1).max(128),
  kind: challengeKindSchema,
  prompt: z.string().trim().min(1).max(1_000),
  expectedAnswer: z.string().trim().min(1).max(200),
  explanation: z.string().trim().min(1).max(1_000),
  context: z.string().trim().min(1).max(1_000),
  choices: z.array(z.string().trim().min(1).max(200)).min(2).max(6).optional(),
});
export type TrainingChallenge = z.infer<typeof trainingChallengeSchema>;
export interface ChallengeGenerationRequest {
  readonly collectionId: string;
  readonly level: VocabularyCollection["level"];
  readonly candidates: readonly {
    readonly id: string;
    readonly englishTerm: string;
    readonly sense: string;
    readonly sourceContext?: string;
  }[];
}
export interface ChallengeGenerator {
  generate(request: ChallengeGenerationRequest): Promise<unknown>;
}
export type ChallengeGenerationErrorCode =
  "COLLECTION_NOT_CONFIRMED" | "NO_APPROVED_CANDIDATES" | "INVALID_CHALLENGES";
export class ChallengeGenerationError extends Error {
  constructor(readonly code: ChallengeGenerationErrorCode) {
    super(`Challenge generation failed: ${code}`);
    this.name = "ChallengeGenerationError";
  }
}
export async function generateTrainingChallenges(
  collection: VocabularyCollection,
  generator: ChallengeGenerator,
): Promise<readonly TrainingChallenge[]> {
  if (collection.status !== "confirmed")
    throw new ChallengeGenerationError("COLLECTION_NOT_CONFIRMED");
  const candidates = collection.candidates
    .filter((candidate) => candidate.status === "approved")
    .map(({ id, englishTerm, sense, sourceContext }) => ({
      id,
      englishTerm,
      sense,
      ...(sourceContext === undefined ? {} : { sourceContext }),
    }));
  if (candidates.length === 0) throw new ChallengeGenerationError("NO_APPROVED_CANDIDATES");
  const parsed = z.array(trainingChallengeSchema).safeParse(
    await generator.generate({
      collectionId: collection.id,
      level: collection.level,
      candidates,
    }),
  );
  const candidateIds = new Set(candidates.map((candidate) => candidate.id));
  if (
    !parsed.success ||
    parsed.data.length !== candidates.length ||
    new Set(parsed.data.map((challenge) => challenge.candidateId)).size !== candidates.length ||
    parsed.data.some((challenge) => !candidateIds.has(challenge.candidateId)) ||
    parsed.data.some(
      (challenge) =>
        challenge.kind === "context-choice" &&
        !challenge.choices?.includes(challenge.expectedAnswer),
    )
  ) {
    throw new ChallengeGenerationError("INVALID_CHALLENGES");
  }
  return Object.freeze(parsed.data);
}
