import type {
  GenerationDraftRecord,
  GenerationDraftRepository,
} from "@vocabulary/database/runtime";
import {
  buildStudySessionSnapshot,
  type ContentProvenance,
  type LexicalContent,
} from "@vocabulary/domain-vocabulary";
import { describe, expect, it } from "vitest";
import { serializeStudySession } from "../app/api/study-sessions/response-contract";
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

function enrichedCandidate(word: string, definition: string, rank: number): EnrichedCandidate {
  const candidateId = `candidate:${word}:noun`;
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
    candidateId,
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
  enrichedCandidate("affection", "A feeling of fondness or care.", 1),
  enrichedCandidate("agreement", "A shared decision.", 2),
  enrichedCandidate("distance", "The space between two things.", 3),
  enrichedCandidate("permission", "Approval to do something.", 4),
]);

const trustedSourceDraft: TrustedGenerationDraft = {
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

const selections = sourceCandidates.map((candidate) => {
  const selectedSense = candidate.lexicalSenses?.[0];

  if (selectedSense === undefined) {
    throw new Error(`Missing lexical sense for ${candidate.candidateId}`);
  }

  return Object.freeze({
    candidateId: candidate.candidateId,
    senseId: selectedSense.senseId,
  });
});

class MemoryGenerationDraftRepository implements GenerationDraftRepository {
  private readonly records = new Map<string, GenerationDraftRecord>();

  constructor(record: GenerationDraftRecord) {
    this.records.set(record.draftId, record);
  }

  save(record: GenerationDraftRecord): Promise<{ readonly created: boolean }> {
    if (this.records.has(record.draftId)) {
      return Promise.resolve({ created: false });
    }

    this.records.set(record.draftId, record);
    return Promise.resolve({ created: true });
  }

  findActive(
    requestedSubjectId: string,
    draftId: string,
    now: Date,
  ): Promise<GenerationDraftRecord | undefined> {
    const record = this.records.get(draftId);

    if (
      record?.subjectId !== requestedSubjectId ||
      new Date(record.expiresAt).getTime() <= now.getTime()
    ) {
      return Promise.resolve(undefined);
    }

    return Promise.resolve(record);
  }
}

function sourceRecord(): GenerationDraftRecord {
  return {
    draftId: sourceDraftId,
    subjectId,
    createdAt,
    expiresAt,
    payload: trustedSourceDraft,
  };
}

async function buildReviewedSession() {
  const repository = new MemoryGenerationDraftRepository(sourceRecord());
  const drafts = createPersistentStudySessionDrafts(
    repository,
    () => new Date("2026-08-05T20:30:00.000Z"),
  );

  const reviewed = await drafts.resolveReview({
    subjectId,
    sourceDraftId,
    resolvedDraftId,
    expiresAt,
    selections,
  });

  if (!reviewed.ok) {
    throw new Error(reviewed.message);
  }

  const resolution = await drafts.resolve(subjectId, {
    draftId: resolvedDraftId,
    title: trustedSourceDraft.title,
    level: trustedSourceDraft.level,
    selectedCandidateIds: reviewed.publishedCandidateIds,
  });

  if (!resolution.ok) {
    throw new Error(resolution.message);
  }

  const session = buildStudySessionSnapshot(resolution.input);

  if (!session.ok) {
    throw new Error(session.message);
  }

  return Object.freeze({
    reviewed,
    session: session.snapshot,
  });
}

describe("reviewed study-session runtime flow", () => {
  it("publishes, resolves, snapshots, and serializes definition choices end to end", async () => {
    const result = await buildReviewedSession();

    expect(result.reviewed).toMatchObject({
      publishedCandidateIds: selections.map(({ candidateId }) => candidateId),
      omittedCandidateIds: [],
    });

    expect(
      result.session.exercises.every((exercise) => exercise.exerciseKind === "definition-choice"),
    ).toBe(true);

    const response = serializeStudySession(result.session);
    const first = response.exercises.at(0);

    expect(response.exercises).toHaveLength(4);
    expect(first).toMatchObject({
      exerciseKind: "definition-choice",
      prompt: "A feeling of fondness or care.",
    });

    if (first?.exerciseKind !== "definition-choice") {
      throw new Error("Expected a public definition-choice exercise");
    }

    expect(first.options).toContain("affection");
    expect(first.options).toContain("agreement");
    expect(first.options).toContain("distance");
    expect(first.options).toContain("permission");
    expect("answer" in first).toBe(false);
  });

  it("keeps definition-choice answers valid through the runtime snapshot", async () => {
    const result = await buildReviewedSession();
    const first = result.session.exercises.at(0);

    expect(first).toBeDefined();
    if (first === undefined) return;

    expect(first.options).toContain(first.answer);
    expect(first.options.filter((option) => option === first.answer)).toHaveLength(1);
  });
});
