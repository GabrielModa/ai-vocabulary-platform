import { describe, expect, it, vi } from "vitest";
import type { LearningCandidate } from "./candidate-pipeline.js";
import type { ContentProvenance, LexicalContent } from "./content.js";
import { resolveCandidateContextually } from "./contextual-candidate-resolution.js";

const provenance: ContentProvenance = {
  provider: "oewn",
  sourceId: "sense-love",
  license: "CC BY 4.0",
  attribution: "Open English WordNet",
  retrievedAt: "2026-08-05T00:00:00.000Z",
  generated: false,
  validationStatus: "verified",
};

const loveSense: LexicalContent = {
  word: "affection",
  normalizedWord: "affection",
  senseId: "sense-love",
  partOfSpeech: "noun",
  definition: "A feeling of fondness or care.",
  provenance,
};

const medicalSense: LexicalContent = {
  word: "affection",
  normalizedWord: "affection",
  senseId: "sense-medical",
  partOfSpeech: "noun",
  definition: "A condition affecting the body.",
  provenance: {
    ...provenance,
    sourceId: "sense-medical",
  },
};

function candidate(senses: readonly LexicalContent[]): LearningCandidate {
  return {
    candidateId: "candidate:affection:noun",
    displayForm: "affection",
    normalizedLemma: "affection",
    proposedPartOfSpeech: "noun",
    lexicalStatus: senses.length === 1 ? "verified" : "ambiguous",
    availableSenses: senses,
    selectionReasons: ["suggested-by-local-ai"],
  };
}

const context = {
  topic: "Love",
  learnerLevel: "B1",
  locale: "en-US",
};

describe("contextual candidate resolution", () => {
  it("resolves a unique official sense without calling AI", async () => {
    const select = vi.fn();
    const result = await resolveCandidateContextually({
      candidate: candidate([loveSense]),
      context,
      selector: { select },
    });

    expect(select).not.toHaveBeenCalled();
    expect(result).toMatchObject({
      ok: true,
      status: "resolved",
      candidate: {
        lexicalStatus: "verified",
        selectedSense: {
          senseId: "sense-love",
          confirmedBy: "unique-provider-match",
        },
      },
      decision: {
        decidedBy: "single-verified-sense",
      },
    });
  });

  it("resolves an ambiguous candidate when constrained AI reports high confidence", async () => {
    const original = candidate([loveSense, medicalSense]);
    const result = await resolveCandidateContextually({
      candidate: original,
      context,
      selector: {
        select: () =>
          Promise.resolve({
            selectedSenseId: "sense-love",
            confidence: 0.99,
            reasonCodes: ["topic-match", "semantic-fit"],
          }),
      },
    });

    expect(result).toMatchObject({
      ok: true,
      status: "resolved",
      candidate: {
        selectedSense: {
          senseId: "sense-love",
          definition: loveSense.definition,
          confirmedBy: "contextual-ai-selection",
        },
      },
      decision: { decidedBy: "contextual-ai-selector", confidence: 0.99 },
    });
  });

  it("resolves an ambiguous candidate when verified topic evidence has a unique winner", async () => {
    const result = await resolveCandidateContextually({
      candidate: candidate([loveSense, medicalSense]),
      context,
      selector: {
        decidedBy: "deterministic-context-selector",
        select: () =>
          Promise.resolve({
            selectedSenseId: "sense-love",
            confidence: 1,
            reasonCodes: ["exact-topic-definition-match", "deterministic-verified-evidence"],
          }),
      },
    });

    expect(result).toMatchObject({
      ok: true,
      status: "resolved",
      candidate: {
        lexicalStatus: "verified",
        selectedSense: {
          senseId: "sense-love",
          confirmedBy: "deterministic-context-selection",
        },
      },
      decision: { decidedBy: "deterministic-context-selector", confidence: 1 },
    });
  });

  it("keeps the candidate reviewable when AI selection fails", async () => {
    const original = candidate([loveSense, medicalSense]);
    const result = await resolveCandidateContextually({
      candidate: original,
      context,
      selector: {
        select: () =>
          Promise.resolve({
            selectedSenseId: "invented",
            confidence: 0.99,
            reasonCodes: ["topic-match"],
          }),
      },
    });

    expect(result).toEqual({
      ok: true,
      status: "needs-review",
      candidate: original,
    });
  });

  it("rejects candidates without selectable lexical evidence", async () => {
    expect(
      await resolveCandidateContextually({
        candidate: candidate([]),
        context,
      }),
    ).toEqual({
      ok: false,
      code: "no-selectable-senses",
      message: "The candidate has no verified lexical sense to select",
    });
  });
});
