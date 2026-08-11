import type { ReviewCandidate } from "./lexical-review";

export interface VerifiedErrorFeedback {
  readonly kind: "semantic-contrast" | "grammar-contrast" | "retrieval-cue";
  readonly message: string;
}

function normalize(value: string): string {
  return value.normalize("NFKC").toLocaleLowerCase("en-US").replace(/\s+/gu, " ").trim();
}

export function buildVerifiedErrorFeedback(
  correct: ReviewCandidate,
  chosenTerm: string,
  candidates: readonly ReviewCandidate[],
): VerifiedErrorFeedback {
  const chosen = candidates.find(({ term }) => normalize(term) === normalize(chosenTerm));
  if (!chosen) {
    return Object.freeze({
      kind: "retrieval-cue",
      message: `The target is the ${correct.type} “${correct.term}”: ${correct.meaning}. Try retrieving it again soon.`,
    });
  }
  if (normalize(chosen.type) !== normalize(correct.type)) {
    return Object.freeze({
      kind: "grammar-contrast",
      message: `“${chosen.term}” is a ${chosen.type}, while this gap needs the ${correct.type} “${correct.term}”: ${correct.meaning}.`,
    });
  }
  return Object.freeze({
    kind: "semantic-contrast",
    message: `“${chosen.term}” means ${chosen.meaning}. Here “${correct.term}” means ${correct.meaning}.`,
  });
}
