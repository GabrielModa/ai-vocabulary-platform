import type { SessionIdentityPort } from "@vocabulary/auth";
import type {
  OwnedStudySessionApplication,
  StudySessionSnapshot,
} from "@vocabulary/domain-vocabulary";
import { describe, expect, it, vi } from "vitest";
import { createStudySessionAnswerHandler } from "./answer-http";

const snapshot: StudySessionSnapshot = {
  snapshotVersion: "study-session-snapshot-v1",
  sessionId: "session-1",
  title: "Food",
  level: "B1",
  createdAt: "2026-08-05T00:00:00.000Z",
  exerciseIds: ["exercise-1"],
  exercises: [
    {
      exerciseId: "exercise-1",
      exerciseKind: "cloze",
      candidateId: "candidate-1",
      senseId: "sense-1",
      exampleId: "example-1",
      sourceSentence: "Students sample regional dishes.",
      gapSentence: "Students ___ regional dishes.",
      answer: "sample",
      options: ["sample", "serve", "carry", "watch"],
      provenance: {
        exampleProvider: "oewn",
        exampleSourceRecordId: "example-1",
        lexicalProvider: "oewn",
        lexicalSourceRecordId: "sense-1",
      },
    },
  ],
};

function identity(
  audience: "learner" | "operator" | "anonymous" = "learner",
): SessionIdentityPort<Headers> {
  return {
    resolve() {
      if (audience === "anonymous") {
        return Promise.resolve({
          kind: "anonymous",
          reason: "missing",
        });
      }

      return Promise.resolve({
        kind: "authenticated",
        subjectId: audience === "learner" ? "learner-1" : "operator-1",
        sessionId: "auth-session-1",
        audience,
        expiresAt: new Date("2027-01-01T00:00:00.000Z"),
      });
    },
  };
}

function application(found = true): OwnedStudySessionApplication {
  return {
    create: vi.fn(),
    get: vi.fn(() =>
      Promise.resolve(
        found
          ? { ok: true as const, snapshot }
          : {
              ok: false as const,
              status: "not-found" as const,
              code: "study-session-not-found" as const,
              message: "Study session was not found",
            },
      ),
    ),
  };
}

function request(
  body: unknown = {
    exerciseId: "exercise-1",
    selectedOption: "sample",
  },
): Request {
  return new Request("http://localhost/api/study-sessions/session-1/answers", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

const context = {
  params: Promise.resolve({ id: "session-1" }),
};

describe("study-session answer HTTP", () => {
  it("scores from the learner-owned immutable snapshot", async () => {
    const handler = createStudySessionAnswerHandler({
      identity: identity(),
      application: application(),
    });

    const response = await handler(request(), context);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      sessionId: "session-1",
      exerciseId: "exercise-1",
      selectedOption: "sample",
      correct: true,
      correctAnswer: "sample",
    });
  });

  it("returns authoritative correction for an incorrect option", async () => {
    const handler = createStudySessionAnswerHandler({
      identity: identity(),
      application: application(),
    });

    const response = await handler(
      request({
        exerciseId: "exercise-1",
        selectedOption: "serve",
      }),
      context,
    );

    await expect(response.json()).resolves.toMatchObject({
      correct: false,
      correctAnswer: "sample",
    });
  });

  it("rejects options outside the immutable exercise", async () => {
    const handler = createStudySessionAnswerHandler({
      identity: identity(),
      application: application(),
    });

    const response = await handler(
      request({
        exerciseId: "exercise-1",
        selectedOption: "invented",
      }),
      context,
    );

    expect(response.status).toBe(400);
  });

  it("hides sessions outside learner ownership", async () => {
    const handler = createStudySessionAnswerHandler({
      identity: identity(),
      application: application(false),
    });

    expect((await handler(request(), context)).status).toBe(404);
  });

  it("requires learner authentication", async () => {
    const anonymous = createStudySessionAnswerHandler({
      identity: identity("anonymous"),
      application: application(),
    });
    const operator = createStudySessionAnswerHandler({
      identity: identity("operator"),
      application: application(),
    });

    expect((await anonymous(request(), context)).status).toBe(401);
    expect((await operator(request(), context)).status).toBe(403);
  });
});
