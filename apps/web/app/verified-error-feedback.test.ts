import { describe, expect, it } from "vitest";
import type { ReviewCandidate } from "./lexical-review";
import { buildVerifiedErrorFeedback } from "./verified-error-feedback";

const correct: ReviewCandidate = {
  term: "pitch",
  type: "noun",
  meaning: "the playing surface",
  example: "The players entered the pitch.",
  challenge: "The players entered the ___.",
};

const candidates: readonly ReviewCandidate[] = [
  correct,
  {
    term: "referee",
    type: "noun",
    meaning: "the official who enforces the rules",
    example: "The referee stopped the match.",
    challenge: "The ___ stopped the match.",
  },
  {
    term: "score",
    type: "verb",
    meaning: "to gain a point or goal",
    example: "They score often.",
    challenge: "They ___ often.",
  },
];

describe("verified error feedback", () => {
  it("contrasts two known meanings from the reviewed set", () => {
    expect(buildVerifiedErrorFeedback(correct, "referee", candidates)).toEqual({
      kind: "semantic-contrast",
      message:
        "“referee” means the official who enforces the rules. Here “pitch” means the playing surface.",
    });
  });

  it("adds a deterministic part-of-speech cue", () => {
    expect(buildVerifiedErrorFeedback(correct, "score", candidates)).toEqual({
      kind: "grammar-contrast",
      message: "“score” is a verb, while this gap needs the noun “pitch”: the playing surface.",
    });
  });

  it("does not assign a meaning to unknown free text", () => {
    expect(buildVerifiedErrorFeedback(correct, "pich", candidates)).toEqual({
      kind: "retrieval-cue",
      message: "The target is the noun “pitch”: the playing surface. Try retrieving it again soon.",
    });
  });
});
