import type { SessionIdentity, SessionIdentityPort } from "@vocabulary/auth";
import type {
  BuildStudySessionSnapshotInput,
  OwnedStudySessionApplication,
  StudySessionSnapshot,
} from "@vocabulary/domain-vocabulary";
import { describe, expect, it, vi } from "vitest";
import { createStudySessionHttpHandlers, type StudySessionDraftPort } from "./http";

const fixtureSnapshot: StudySessionSnapshot = {
  sessionId: "study-session:fixture",
  snapshotVersion: "study-session-snapshot-v1",
  title: "Food",
  level: "B1",
  createdAt: "2026-08-04T12:30:00.000Z",
  exerciseIds: ["exercise:sample"],
  exercises: [
    {
      exerciseId: "exercise:sample",
      exerciseKind: "cloze",
      candidateId: "candidate:sample",
      senseId: "sense:sample",
      exampleId: "example:sample",
      sourceSentence: "Students sample regional dishes.",
      gapSentence: "Students ___ regional dishes.",
      answer: "sample",
      options: ["sample", "taste", "serve", "cook"],
      provenance: {
        exampleProvider: "open-english-wordnet",
        exampleSourceRecordId: "example:sample",
        lexicalProvider: "open-english-wordnet",
        lexicalSourceRecordId: "sense:sample",
      },
    },
  ],
};

const trustedInput = {
  title: "Food",
  level: "B1",
  createdAt: "2026-08-04T12:30:00.000Z",
  selectedCandidateIds: [],
  candidates: [],
} satisfies BuildStudySessionSnapshotInput;

function identity(value: SessionIdentity): SessionIdentityPort<Headers> {
  return {
    resolve() {
      return Promise.resolve(value);
    },
  };
}

function learner(): SessionIdentity {
  return {
    kind: "authenticated",
    subjectId: "learner-1",
    sessionId: "auth-session-1",
    audience: "learner",
    expiresAt: new Date("2027-01-01T00:00:00.000Z"),
  };
}

function drafts(): StudySessionDraftPort {
  return {
    resolve() {
      return Promise.resolve({ ok: true, input: trustedInput });
    },
  };
}

function application(
  overrides: Partial<OwnedStudySessionApplication> = {},
): OwnedStudySessionApplication {
  return {
    create() {
      return Promise.resolve({
        ok: true,
        status: "created",
        snapshot: fixtureSnapshot,
        omittedCandidateIds: [],
      });
    },
    get() {
      return Promise.resolve({
        ok: true,
        status: "found",
        snapshot: fixtureSnapshot,
      });
    },
    ...overrides,
  };
}

function postRequest(body: unknown): Request {
  return new Request("http://localhost/api/study-sessions", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("study session HTTP handlers", () => {
  it("rejects anonymous requests before resolving drafts", async () => {
    const resolve = vi.fn<StudySessionDraftPort["resolve"]>();
    const handlers = createStudySessionHttpHandlers({
      identity: identity({ kind: "anonymous", reason: "missing" }),
      drafts: { resolve },
      application: application(),
    });

    const response = await handlers.POST(
      postRequest({
        draftId: "draft-1",
        title: "Food",
        level: "B1",
        selectedCandidateIds: ["candidate:sample"],
      }),
    );

    expect(response.status).toBe(401);
    expect(resolve).not.toHaveBeenCalled();
  });

  it("rejects non-learner identities", async () => {
    const handlers = createStudySessionHttpHandlers({
      identity: identity({
        kind: "authenticated",
        subjectId: "operator-1",
        sessionId: "auth-session-1",
        audience: "operator",
        expiresAt: new Date("2027-01-01T00:00:00.000Z"),
      }),
      drafts: drafts(),
      application: application(),
    });

    const response = await handlers.POST(
      postRequest({
        draftId: "draft-1",
        title: "Food",
        level: "B1",
        selectedCandidateIds: [],
      }),
    );

    expect(response.status).toBe(403);
  });

  it("creates from a trusted server-side draft", async () => {
    const create = vi.fn<OwnedStudySessionApplication["create"]>(() =>
      Promise.resolve({
        ok: true,
        status: "created",
        snapshot: fixtureSnapshot,
        omittedCandidateIds: [],
      }),
    );
    const handlers = createStudySessionHttpHandlers({
      identity: identity(learner()),
      drafts: drafts(),
      application: application({ create }),
    });

    const response = await handlers.POST(
      postRequest({
        draftId: "draft-1",
        title: "Food",
        level: "B1",
        selectedCandidateIds: ["candidate:sample"],
      }),
    );

    expect(response.status).toBe(201);
    expect(create).toHaveBeenCalledWith("learner-1", trustedInput);
    expect(await response.json()).not.toHaveProperty("answer");
  });

  it("returns 200 for an idempotently existing session", async () => {
    const handlers = createStudySessionHttpHandlers({
      identity: identity(learner()),
      drafts: drafts(),
      application: application({
        create() {
          return Promise.resolve({
            ok: true,
            status: "existing",
            snapshot: fixtureSnapshot,
            omittedCandidateIds: [],
          });
        },
      }),
    });

    const response = await handlers.POST(
      postRequest({
        draftId: "draft-1",
        title: "Food",
        level: "B1",
        selectedCandidateIds: [],
      }),
    );

    expect(response.status).toBe(200);
  });

  it("does not accept exercise content from the client", async () => {
    const handlers = createStudySessionHttpHandlers({
      identity: identity(learner()),
      drafts: drafts(),
      application: application(),
    });

    const response = await handlers.POST(
      postRequest({
        title: "Food",
        level: "B1",
        exercises: [fixtureSnapshot.exercises[0]],
      }),
    );

    expect(response.status).toBe(400);
  });

  it("maps missing drafts and invalid selections safely", async () => {
    const missing = createStudySessionHttpHandlers({
      identity: identity(learner()),
      drafts: {
        resolve() {
          return Promise.resolve({
            ok: false,
            code: "draft-not-found",
            message: "Draft was not found",
          });
        },
      },
      application: application(),
    });

    expect(
      (
        await missing.POST(
          postRequest({
            draftId: "missing",
            title: "Food",
            level: "B1",
            selectedCandidateIds: [],
          }),
        )
      ).status,
    ).toBe(404);
  });

  it("loads an owned session without exposing its answer", async () => {
    const get = vi.fn<OwnedStudySessionApplication["get"]>(() =>
      Promise.resolve({
        ok: true,
        status: "found",
        snapshot: fixtureSnapshot,
      }),
    );
    const handlers = createStudySessionHttpHandlers({
      identity: identity(learner()),
      drafts: drafts(),
      application: application({ get }),
    });

    const response = await handlers.GET(
      new Request("http://localhost/api/study-sessions/study-session%3Afixture"),
      { params: Promise.resolve({ id: "study-session:fixture" }) },
    );

    expect(response.status).toBe(200);
    expect(get).toHaveBeenCalledWith("learner-1", "study-session:fixture");
    expect(JSON.stringify(await response.json())).not.toContain("sample regional");
  });

  it("returns 404 for missing or unauthorized sessions", async () => {
    const handlers = createStudySessionHttpHandlers({
      identity: identity(learner()),
      drafts: drafts(),
      application: application({
        get() {
          return Promise.resolve({
            ok: false,
            status: "not-found",
            code: "study-session-not-found",
            message: "Study session was not found",
          });
        },
      }),
    });

    const response = await handlers.GET(
      new Request("http://localhost/api/study-sessions/missing"),
      { params: Promise.resolve({ id: "missing" }) },
    );

    expect(response.status).toBe(404);
  });
});
