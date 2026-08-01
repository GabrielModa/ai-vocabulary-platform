import { confirmCollection } from "./collection.js";
import { generateTrainingChallenges, type ChallengeGenerator } from "./challenges.js";
import type { VocabularyCollectionRepository } from "./repository.js";
import {
  sessionScore,
  startRetrievalSession,
  submitRetrievalAnswer,
  type RetrievalSession,
} from "./session.js";
import {
  createTopicCollection,
  type CreateTopicCollectionRequest,
  type TopicGenerationDependencies,
} from "./topic-generation.js";

export interface TopicVocabularyLoopRequest extends CreateTopicCollectionRequest {
  readonly sessionId: string;
  readonly answers: readonly string[];
}
export interface TopicVocabularyLoopDependencies extends TopicGenerationDependencies {
  readonly repository: VocabularyCollectionRepository;
  readonly challengeGenerator: ChallengeGenerator;
}
export interface CompletedVocabularyLoop {
  readonly collectionId: string;
  readonly collectionVersion: number;
  readonly session: RetrievalSession;
  readonly score: { readonly correct: number; readonly attempted: number };
}
export class VocabularyLoopError extends Error {
  constructor(readonly code: "ANSWER_COUNT_MISMATCH") {
    super(`Vocabulary loop failed: ${code}`);
    this.name = "VocabularyLoopError";
  }
}
export async function runTopicVocabularyLoop(
  request: TopicVocabularyLoopRequest,
  dependencies: TopicVocabularyLoopDependencies,
): Promise<CompletedVocabularyLoop> {
  const draft = await createTopicCollection(request, dependencies);
  await dependencies.repository.create(draft);
  const confirmed = confirmCollection(
    draft,
    draft.candidates.map(({ id }) => id),
  );
  const stored = await dependencies.repository.save(confirmed, 1);
  const challenges = await generateTrainingChallenges(
    stored.collection,
    dependencies.challengeGenerator,
  );
  if (request.answers.length !== challenges.length)
    throw new VocabularyLoopError("ANSWER_COUNT_MISMATCH");
  let session = startRetrievalSession(request.sessionId, challenges);
  for (const answer of request.answers) session = submitRetrievalAnswer(session, answer);
  return Object.freeze({
    collectionId: stored.collection.id,
    collectionVersion: stored.version,
    session,
    score: sessionScore(session),
  });
}
