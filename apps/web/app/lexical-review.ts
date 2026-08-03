export interface ContentProvenance {
  readonly provider: string;
  readonly sourceVersion?: string;
  readonly sourceId?: string;
  readonly sourceUrl?: string;
  readonly license?: string;
  readonly attribution?: string;
  readonly retrievedAt: string;
  readonly generated: boolean;
  readonly adaptedFrom?: string;
  readonly validationStatus: "pending" | "provisional" | "verified" | "rejected";
}

export interface LexicalSense {
  readonly word: string;
  readonly normalizedWord: string;
  readonly senseId: string;
  readonly partOfSpeech: string;
  readonly definition?: string;
  readonly cefr?: string;
  readonly provenance: ContentProvenance;
}

export interface ReviewCandidate {
  readonly term: string;
  readonly meaning: string;
  readonly type: string;
  readonly example: string;
  readonly challenge: string;
  readonly contexts?: readonly string[];
  readonly lexicalValidationStatus?: "verified" | "provisional" | "unavailable";
  readonly senseId?: string;
  readonly lexicalProvenance?: ContentProvenance;
  readonly lexicalSenses?: readonly LexicalSense[];
}

export function compatibleLexicalSenses(candidate: ReviewCandidate): readonly LexicalSense[] {
  return (candidate.lexicalSenses ?? []).filter(
    (sense) => sense.partOfSpeech === candidate.type && Boolean(sense.definition),
  );
}

export function requiresSenseConfirmation(candidate: ReviewCandidate): boolean {
  return (
    candidate.lexicalValidationStatus === "provisional" &&
    compatibleLexicalSenses(candidate).length > 1
  );
}

export function resolveCandidateSense(
  candidate: ReviewCandidate,
  senseId: string,
): ReviewCandidate {
  const sense = compatibleLexicalSenses(candidate).find((item) => item.senseId === senseId);
  if (!sense?.definition) throw new Error("Selected sense is not compatible");
  return {
    ...candidate,
    meaning: sense.definition,
    lexicalValidationStatus: "verified",
    senseId: sense.senseId,
    lexicalProvenance: sense.provenance,
  };
}

export function countUnresolvedSelectedCandidates(
  candidates: readonly ReviewCandidate[],
  selected: ReadonlySet<string>,
): number {
  return candidates.filter(
    (candidate) => selected.has(candidate.term) && requiresSenseConfirmation(candidate),
  ).length;
}
