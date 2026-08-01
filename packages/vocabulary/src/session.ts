import { z } from "zod";
import { trainingChallengeSchema, type TrainingChallenge } from "./challenges.js";

export interface TrainingAttempt {
  readonly challengeId: string;
  readonly answer: string;
  readonly correct: boolean;
  readonly expectedAnswer: string;
  readonly sequence: number;
}
export interface RetrievalSession {
  readonly id: string;
  readonly status: "active" | "completed";
  readonly challenges: readonly TrainingChallenge[];
  readonly currentIndex: number;
  readonly attempts: readonly TrainingAttempt[];
}
export class RetrievalSessionError extends Error {
  constructor(readonly code: "INVALID_SESSION" | "SESSION_COMPLETED" | "EMPTY_ANSWER") {
    super(`Retrieval session failed: ${code}`);
    this.name = "RetrievalSessionError";
  }
}
function normalize(value: string): string {
  return value.normalize("NFKC").toLocaleLowerCase("en-US").replace(/\s+/gu, " ").trim();
}
export function startRetrievalSession(
  id: string,
  challengeInput: readonly TrainingChallenge[],
): RetrievalSession {
  if (
    !z.string().trim().min(1).max(128).safeParse(id).success ||
    !z.array(trainingChallengeSchema).min(1).safeParse(challengeInput).success
  )
    throw new RetrievalSessionError("INVALID_SESSION");
  return Object.freeze({
    id,
    status: "active",
    challenges: structuredClone(challengeInput),
    currentIndex: 0,
    attempts: [],
  });
}
export function submitRetrievalAnswer(session: RetrievalSession, answer: string): RetrievalSession {
  if (session.status === "completed") throw new RetrievalSessionError("SESSION_COMPLETED");
  const normalizedAnswer = normalize(answer);
  if (!normalizedAnswer) throw new RetrievalSessionError("EMPTY_ANSWER");
  const challenge = session.challenges[session.currentIndex];
  if (!challenge) throw new RetrievalSessionError("INVALID_SESSION");
  const attempts = [
    ...session.attempts,
    Object.freeze({
      challengeId: challenge.id,
      answer: answer.trim(),
      correct: normalizedAnswer === normalize(challenge.expectedAnswer),
      expectedAnswer: challenge.expectedAnswer,
      sequence: session.attempts.length + 1,
    }),
  ];
  const currentIndex = session.currentIndex + 1;
  return Object.freeze({
    ...session,
    attempts: Object.freeze(attempts),
    currentIndex,
    status: currentIndex === session.challenges.length ? "completed" : "active",
  });
}
export function sessionScore(session: RetrievalSession): {
  readonly correct: number;
  readonly attempted: number;
} {
  return Object.freeze({
    correct: session.attempts.filter((attempt) => attempt.correct).length,
    attempted: session.attempts.length,
  });
}
