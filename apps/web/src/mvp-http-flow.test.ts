import type { SessionIdentityPort } from "@vocabulary/auth";
import type {
  GenerationDraftRecord,
  GenerationDraftRepository,
} from "@vocabulary/database/runtime";
import {
  buildStudySessionSnapshot,
  type BuildStudySessionSnapshotInput,
  type ContentProvenance,
  type LexicalContent,
  type OwnedStudySessionApplication,
  type StudySessionSnapshot,
} from "@vocabulary/domain-vocabulary";
import { describe, expect, it } from "vitest";
import { createStudySessionAnswerHandler } from "../app/api/study-sessions/answer-http";
import { createStudySessionHttpHandlers } from "../app/api/study-sessions/http";
import { createDraftResolutionHandler } from "../app/api/vocabulary/drafts/resolve-http";
import type { EnrichedCandidate } from "../app/api/vocabulary/generate/lexical-enrichment";
import {
  createPersistentStudySessionDrafts,
  GENERATION_DRAFT_VERSION,
  type TrustedGenerationDraft,
} from "./study-session-drafts";

const subjectId = "learner-1";
const sourceDraftId = "draft:source";
const resolvedDraftId = "draft:resolved";
const createdAt = "2026-08-05T20:00:00.000Z";
const expiresAt = "2026-08-05T21:00:00.000Z";

const provenance: ContentProvenance = {
  provider: "oewn",
  sourceId: "test-source",
  license: "CC BY 4.0",
  attribution: "Open English WordNet",
  retrievedAt: createdAt,
  generated: false,
  validationStatus: "verified",
};

function identity(): SessionIdentityPort<Headers> {
  return {
    resolve() {
      return Promise.resolve({
        kind: "authenticated",
        subjectId,
        sessionId: "auth-session-1",
        audience: "learner",
        expiresAt: new Date("2027-01-01T00:00:00.000Z"),
      });
    },
  };
}

function candidate(word: string, definition: string, rank: number): EnrichedCandidate {
  const sense: LexicalContent = {
    word,
    normalizedWord: word,
    senseId: `sense:${word}`,
    partOfSpeech: "noun",
    definition,
    provenance: {
      ...provenance,
      sourceId: `sense:${word}`,
    },
  };

  return {
    term: word,
    meaning: definition,
    type: "noun",
    example: `${word} appears in a reviewed example.`,
    challenge: `Which word means ${definition}?`,
    candidateId: `candidate:${word}:noun`,
    normalizedLemma: word,
    selectionReasons: ["suggested-by-local-ai", "matched-request-context"],
    lexicalValidationStatus: "verified",
    rank,
    rankingScore: 100 - rank,
    rankingContributions: [],
    frequencyPercentile: 0.7 - rank * 0.05,
    senseId: sense.senseId,
    lexicalProvenance: sense.provenance,
    lexicalSenses: [sense],
    exerciseKind: "definition-choice",
  };
}

const sourceCandidates = Object.freeze([
  candidate("affection", "A feeling of fondness or care.", 1),
  candidate("agreement", "A shared decision.", 2),
  candidate("distance", "The space between two things.", 3),
  candidate("permission", "Approval to do something.", 4),
]);

const trustedDraft: TrustedGenerationDraft = {
  version: GENERATION_DRAFT_VERSION,
  title: "Love vocabulary",
  level: "B1",
  createdAt,
  candidates: sourceCandidates.map(({ candidateId }) => ({
    candidateId,
    outcome: { outcome: "reject" },
  })),
  sourceCandidates,
};

const selections = sourceCandidates.map((sourceCandidate) => {
  const sense = sourceCandidate.lexicalSenses?.at(0);

  if (sense === undefined) {
    throw new Error(`Missing sense for ${sourceCandidate.candidateId}`);
  }

  return Object.freeze({
    candidateId: sourceCandidate.candidateId,
    senseId: sense.senseId,
  });
});

class MemoryDraftRepository implements GenerationDraftRepository {
  private readonly values = new Map<string, GenerationDraftRecord>();

  constructor() {
    this.values.set(sourceDraftId, {
      draftId: sourceDraftId,
      subjectId,
      createdAt,
      expiresAt,
      payload: trustedDraft,
    });
  }

  save(record: GenerationDraftRecord): Promise<{ readonly created: boolean }> {
    if (this.values.has(record.draftId)) {
      return Promise.resolve({
        created: false,
      });
    }

    this.values.set(record.draftId, record);
    return Promise.resolve({ created: true });
  }

  findActive(
    requestedSubjectId: string,
    draftId: string,
    now: Date,
  ): Promise<GenerationDraftRecord | undefined> {
    const record = this.values.get(draftId);

    if (record?.subjectId !== requestedSubjectId || Date.parse(record.expiresAt) <= now.getTime()) {
      return Promise.resolve(undefined);
    }

    return Promise.resolve(record);
  }
}

interface TestStudySessionApplication extends OwnedStudySessionApplication {
  snapshot(): StudySessionSnapshot;
}

function createMemoryStudySessionApplication(): TestStudySessionApplication {
  let current: StudySessionSnapshot | undefined;

  const create: OwnedStudySessionApplication["create"] = (
    requestedSubjectId: string,
    input: BuildStudySessionSnapshotInput,
  ) => {
    if (requestedSubjectId !== subjectId) {
      return Promise.resolve({
        ok: false,
        status: "ownership-failed",
        code: "study-session-ownership-failed",
        message: "Study session ownership failed",
      });
    }

    const result = buildStudySessionSnapshot(input);

    if (!result.ok) {
      return Promise.resolve({
        ok: false,
        status: "invalid",
        code: result.code,
        message: result.message,
      });
    }

    current = result.snapshot;

    return Promise.resolve({
      ok: true,
      status: "created",
      snapshot: result.snapshot,
      omittedCandidateIds: result.omittedCandidateIds,
    });
  };

  const get: OwnedStudySessionApplication["get"] = (
    requestedSubjectId: string,
    sessionId: string,
  ) => {
    if (requestedSubjectId !== subjectId || current?.sessionId !== sessionId) {
      return Promise.resolve({
        ok: false,
        status: "not-found",
        code: "study-session-not-found",
        message: "Study session was not found",
      });
    }

    return Promise.resolve({
      ok: true,
      status: "found",
      snapshot: current,
    });
  };

  return Object.freeze({
    create,
    get,
    snapshot() {
      if (current === undefined) {
        throw new Error("Study session was not created");
      }

      return current;
    },
  });
}

function jsonRequest(url: string, body: unknown): Request {
  return new Request(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

describe("MVP HTTP flow", () => {
  it("resolves review, creates a session, loads it, and scores an answer", async () => {
    const drafts = createPersistentStudySessionDrafts(
      new MemoryDraftRepository(),
      () => new Date("2026-08-05T20:30:00.000Z"),
    );
    const application = createMemoryStudySessionApplication();
    const learnerIdentity = identity();

    const resolveDraft = createDraftResolutionHandler({
      identity: learnerIdentity,
      drafts,
      now: () => new Date("2026-08-05T20:30:00.000Z"),
      createDraftId: () => resolvedDraftId,
    });

    const resolutionResponse = await resolveDraft(
      jsonRequest(`http://localhost/api/vocabulary/drafts/${sourceDraftId}/resolve`, {
        selections,
      }),
      {
        params: Promise.resolve({
          id: sourceDraftId,
        }),
      },
    );

    expect(resolutionResponse.status).toBe(200);
    await expect(resolutionResponse.json()).resolves.toMatchObject({
      draftId: resolvedDraftId,
      publishedCandidateIds: selections.map(({ candidateId }) => candidateId),
      omittedCandidateIds: [],
    });

    const sessions = createStudySessionHttpHandlers({
      identity: learnerIdentity,
      drafts,
      application,
    });

    const creationResponse = await sessions.POST(
      jsonRequest("http://localhost/api/study-sessions", {
        draftId: resolvedDraftId,
        title: trustedDraft.title,
        level: trustedDraft.level,
        selectedCandidateIds: selections.map(({ candidateId }) => candidateId),
      }),
    );

    expect(creationResponse.status).toBe(201);

    const publicCreationBody: unknown = await creationResponse.json();

    expect(publicCreationBody).toMatchObject({
      title: trustedDraft.title,
      level: trustedDraft.level,
    });

    const creationJson = JSON.stringify(publicCreationBody);

    expect(creationJson).toContain('"exerciseKind":"definition-choice"');
    expect(creationJson).toContain('"prompt":"A feeling of fondness or care."');
    expect(creationJson).not.toContain('"answer"');

    const snapshot = application.snapshot();

    expect(snapshot.exercises).toHaveLength(4);
    expect(
      snapshot.exercises.every((exercise) => exercise.exerciseKind === "definition-choice"),
    ).toBe(true);

    const firstExercise = snapshot.exercises.at(0);

    if (firstExercise === undefined) {
      throw new Error("Expected a published exercise");
    }

    const loadResponse = await sessions.GET(
      new Request(`http://localhost/api/study-sessions/${snapshot.sessionId}`),
      {
        params: Promise.resolve({
          id: snapshot.sessionId,
        }),
      },
    );

    expect(loadResponse.status).toBe(200);
    expect(JSON.stringify(await loadResponse.json())).not.toContain('"answer"');

    const answer = createStudySessionAnswerHandler({
      identity: learnerIdentity,
      application,
    });

    const answerResponse = await answer(
      jsonRequest(`http://localhost/api/study-sessions/${snapshot.sessionId}/answers`, {
        exerciseId: firstExercise.exerciseId,
        selectedOption: firstExercise.answer,
      }),
      {
        params: Promise.resolve({
          id: snapshot.sessionId,
        }),
      },
    );

    expect(answerResponse.status).toBe(200);
    await expect(answerResponse.json()).resolves.toEqual({
      sessionId: snapshot.sessionId,
      exerciseId: firstExercise.exerciseId,
      selectedOption: firstExercise.answer,
      correct: true,
      correctAnswer: firstExercise.answer,
    });
  });
});
