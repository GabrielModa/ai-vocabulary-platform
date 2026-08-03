import { describe, expect, it } from "vitest";
import type { LearningCandidate } from "./candidate-pipeline.js";
import {
  createExerciseArtifact,
  createImageArtifact,
  invalidateArtifact,
  isArtifactStale,
  markArtifactStale,
} from "./learning-artifact.js";

const candidate: LearningCandidate = {
  candidateId: "candidate:uncle:noun",
  displayForm: "uncle",
  normalizedLemma: "uncle",
  proposedPartOfSpeech: "noun",
  lexicalStatus: "verified",
  selectedSense: {
    senseId: "oewn-family-n",
    definition: "the brother of your father or mother; the husband of your aunt",
    partOfSpeech: "noun",
    provenance: {
      provider: "open-english-wordnet",
      sourceVersion: "2025",
      sourceId: "oewn-family-n",
      sourceUrl: "https://en-word.net/static/english-wordnet-2025-json.zip",
      license: "CC-BY-4.0",
      attribution: "Open English WordNet contributors",
      retrievedAt: "2026-08-03T00:00:00.000Z",
      generated: false,
      validationStatus: "verified",
    },
    confirmedBy: "unique-provider-match",
  },
  availableSenses: [],
  selectionReasons: ["suggested-by-local-ai"],
};

const createdAt = "2026-08-03T21:30:00.000Z";

describe("sense-bound learning artifacts", () => {
  it("creates a deterministic exercise identity bound to candidate and sense", () => {
    const artifact = createExerciseArtifact({
      candidate,
      exerciseKind: "definition-choice",
      prompt: "Which word matches this meaning?",
      answer: "uncle",
      options: ["uncle", "aunt", "cousin", "nephew"],
      source: { kind: "deterministic" },
      createdAt,
    });

    expect(artifact).toMatchObject({
      artifactId: "artifact:candidate%3Auncle%3Anoun:oewn-family-n:exercise:1",
      candidateId: candidate.candidateId,
      senseId: candidate.selectedSense?.senseId,
      sourceDefinition: candidate.selectedSense?.definition,
      status: "ready",
      version: 1,
    });
  });

  it("creates an image artifact with the same semantic identity", () => {
    const artifact = createImageArtifact({
      candidate,
      semanticContext: candidate.selectedSense?.definition ?? "",
      source: { kind: "generated", provider: "local-image-worker", model: "local" },
      createdAt,
      imageJobId: "job-1",
      status: "generating",
    });

    expect(artifact).toMatchObject({
      candidateId: candidate.candidateId,
      senseId: candidate.selectedSense?.senseId,
      type: "image",
      status: "generating",
      imageJobId: "job-1",
    });
  });

  it("rejects artifact creation without a selected lexical sense", () => {
    const ambiguousCandidate: LearningCandidate = {
      candidateId: candidate.candidateId,
      displayForm: candidate.displayForm,
      normalizedLemma: candidate.normalizedLemma,
      proposedPartOfSpeech: "noun",
      lexicalStatus: "ambiguous",
      availableSenses: candidate.availableSenses,
      selectionReasons: candidate.selectionReasons,
    };

    expect(() =>
      createImageArtifact({
        candidate: ambiguousCandidate,
        semanticContext: "family relationship",
        source: { kind: "generated" },
        createdAt,
      }),
    ).toThrow("Learning artifacts require a selected lexical sense");
  });

  it("detects stale artifacts when the selected sense changes", () => {
    const artifact = createExerciseArtifact({
      candidate,
      exerciseKind: "definition-choice",
      prompt: "Which word matches this meaning?",
      answer: "uncle",
      options: ["uncle"],
      source: { kind: "deterministic" },
      createdAt,
    });
    const changed = {
      ...candidate,
      selectedSense: {
        ...candidate.selectedSense,
        senseId: "oewn-helper-n",
        definition: "a person who gives practical assistance",
      },
    } as LearningCandidate;

    expect(isArtifactStale(artifact, candidate)).toBe(false);
    expect(isArtifactStale(artifact, changed)).toBe(true);
  });

  it("marks stale and invalid states immutably", () => {
    const artifact = createImageArtifact({
      candidate,
      semanticContext: "family relationship",
      source: { kind: "generated" },
      createdAt,
    });
    const stale = markArtifactStale(artifact);
    const invalid = invalidateArtifact(stale, "unsafe-image");

    expect(artifact.status).toBe("pending");
    expect(stale).toMatchObject({
      status: "stale",
      invalidationReason: "source-sense-changed",
    });
    expect(invalid).toMatchObject({ status: "invalid", invalidationReason: "unsafe-image" });
  });

  it("requires the exercise answer to exist among its options", () => {
    expect(() =>
      createExerciseArtifact({
        candidate,
        exerciseKind: "definition-choice",
        prompt: "Which word matches this meaning?",
        answer: "uncle",
        options: ["aunt", "cousin"],
        source: { kind: "deterministic" },
        createdAt,
      }),
    ).toThrow("Exercise options must contain the answer");
  });
});
