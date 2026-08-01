import { describe, expect, it } from "vitest";
import {
  RetrievalSessionError,
  sessionScore,
  startRetrievalSession,
  submitRetrievalAnswer,
} from "./session.js";

const challenges = [
  {
    id: "challenge_1",
    candidateId: "candidate_1",
    kind: "recall" as const,
    prompt: "What word means a playing surface?",
    expectedAnswer: "pitch",
    explanation: "A pitch is the playing surface.",
    context: "The players walked onto the pitch.",
  },
  {
    id: "challenge_2",
    candidateId: "candidate_2",
    kind: "cloze" as const,
    prompt: "Complete: Please ___ the ball.",
    expectedAnswer: "pass",
    explanation: "Pass means to send the ball.",
    context: "Please pass the ball to me.",
  },
];
describe("retrieval training session", () => {
  it("runs one challenge at a time and completes deterministically", () => {
    const started = startRetrievalSession("session_1", challenges);
    const first = submitRetrievalAnswer(started, "  PITCH ");
    expect(first).toMatchObject({ status: "active", currentIndex: 1 });
    expect(first.attempts[0]).toEqual({
      challengeId: "challenge_1",
      answer: "PITCH",
      correct: true,
      expectedAnswer: "pitch",
      sequence: 1,
    });
    const completed = submitRetrievalAnswer(first, "kick");
    expect(completed.status).toBe("completed");
    expect(completed.attempts[1]).toMatchObject({ correct: false, expectedAnswer: "pass" });
    expect(sessionScore(completed)).toEqual({ correct: 1, attempted: 2 });
  });
  it("rejects invalid sessions and blank answers", () => {
    expect(() => startRetrievalSession("session_1", [])).toThrowError(
      new RetrievalSessionError("INVALID_SESSION"),
    );
    expect(() =>
      submitRetrievalAnswer(startRetrievalSession("session_1", challenges), "   "),
    ).toThrowError(new RetrievalSessionError("EMPTY_ANSWER"));
  });
  it("does not accept another answer after completion", () => {
    const firstChallenge = challenges[0];
    if (!firstChallenge) throw new Error("missing challenge fixture");
    const one = startRetrievalSession("session_1", [firstChallenge]);
    expect(() => submitRetrievalAnswer(submitRetrievalAnswer(one, "pitch"), "again")).toThrowError(
      new RetrievalSessionError("SESSION_COMPLETED"),
    );
  });
});
