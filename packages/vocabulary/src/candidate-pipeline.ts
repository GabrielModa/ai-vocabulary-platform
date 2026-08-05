import { lexicalContentSchema, type ContentProvenance, type LexicalContent } from "./content.js";

export type CandidateLexicalStatus = "verified" | "ambiguous" | "provisional" | "unavailable";

export interface CandidateSuggestion {
  readonly term: string;
  readonly proposedPartOfSpeech?: string;
  readonly selectionReasons?: readonly string[];
}

export interface SelectedLexicalSense {
  readonly senseId: string;
  readonly definition: string;
  readonly partOfSpeech: string;
  readonly provenance: ContentProvenance;
  readonly confirmedBy: "unique-provider-match" | "contextual-ai-selection" | "learner-selection";
}

export interface LearningCandidate {
  readonly candidateId: string;
  readonly displayForm: string;
  readonly normalizedLemma: string;
  readonly proposedPartOfSpeech?: string;
  readonly lexicalStatus: CandidateLexicalStatus;
  readonly selectedSense?: SelectedLexicalSense;
  readonly availableSenses: readonly LexicalContent[];
  readonly selectionReasons: readonly string[];
}

export type CandidateRejectionReason = "empty-term" | "duplicate-term" | "invalid-provider-result";

export interface RejectedCandidate {
  readonly term: string;
  readonly normalizedLemma?: string;
  readonly reason: CandidateRejectionReason;
}

export interface CandidatePipelineResult {
  readonly candidates: readonly LearningCandidate[];
  readonly rejected: readonly RejectedCandidate[];
  readonly strategy: "suggest-verify-select";
}

export interface CandidateLexicalLookup {
  lookup(request: { readonly word: string; readonly language: string }): Promise<unknown>;
}

export function normalizeCandidateTerm(value: string): string {
  return value.normalize("NFKC").toLocaleLowerCase("en-US").replace(/\s+/gu, " ").trim();
}

function candidateId(normalizedLemma: string, partOfSpeech?: string): string {
  return `candidate:${normalizedLemma}:${partOfSpeech ?? "unknown"}`;
}

function verifiedSense(sense: LexicalContent): SelectedLexicalSense | undefined {
  if (!sense.definition) return undefined;
  return {
    senseId: sense.senseId,
    definition: sense.definition,
    partOfSpeech: sense.partOfSpeech,
    provenance: sense.provenance,
    confirmedBy: "unique-provider-match",
  };
}

async function lookupSenses(
  suggestion: CandidateSuggestion,
  lookup: CandidateLexicalLookup | undefined,
): Promise<{ readonly senses: readonly LexicalContent[]; readonly invalid: boolean }> {
  if (!lookup) return { senses: [], invalid: false };
  try {
    const result = await lookup.lookup({ word: suggestion.term, language: "en" });
    if (!Array.isArray(result) || result.length > 100) return { senses: [], invalid: true };
    return { senses: result.map((sense) => lexicalContentSchema.parse(sense)), invalid: false };
  } catch {
    return { senses: [], invalid: true };
  }
}

export async function buildVerifiedCandidatePipeline(
  suggestions: readonly CandidateSuggestion[],
  lookup: CandidateLexicalLookup | undefined,
): Promise<CandidatePipelineResult> {
  const candidates: LearningCandidate[] = [];
  const rejected: RejectedCandidate[] = [];
  const seen = new Set<string>();

  for (const suggestion of suggestions) {
    const normalizedLemma = normalizeCandidateTerm(suggestion.term);
    if (!normalizedLemma) {
      rejected.push({ term: suggestion.term, reason: "empty-term" });
      continue;
    }

    const dedupeKey = `${normalizedLemma}:${suggestion.proposedPartOfSpeech ?? "unknown"}`;
    if (seen.has(dedupeKey)) {
      rejected.push({ term: suggestion.term, normalizedLemma, reason: "duplicate-term" });
      continue;
    }
    seen.add(dedupeKey);

    const { senses, invalid } = await lookupSenses(suggestion, lookup);
    if (invalid) {
      candidates.push({
        candidateId: candidateId(normalizedLemma, suggestion.proposedPartOfSpeech),
        displayForm: suggestion.term.trim(),
        normalizedLemma,
        ...(suggestion.proposedPartOfSpeech
          ? { proposedPartOfSpeech: suggestion.proposedPartOfSpeech }
          : {}),
        lexicalStatus: "unavailable",
        availableSenses: [],
        selectionReasons: suggestion.selectionReasons ?? ["suggested-by-local-ai"],
      });
      continue;
    }

    const compatible = suggestion.proposedPartOfSpeech
      ? senses.filter((sense) => sense.partOfSpeech === suggestion.proposedPartOfSpeech)
      : senses;
    const selectable = compatible.filter((sense) => Boolean(sense.definition));
    const onlySelectableSense = selectable.length === 1 ? selectable[0] : undefined;
    const selectedSense = onlySelectableSense ? verifiedSense(onlySelectableSense) : undefined;
    const lexicalStatus: CandidateLexicalStatus = selectedSense
      ? "verified"
      : selectable.length > 1
        ? "ambiguous"
        : senses.length > 0
          ? "provisional"
          : "unavailable";

    candidates.push({
      candidateId: candidateId(normalizedLemma, suggestion.proposedPartOfSpeech),
      displayForm: suggestion.term.trim(),
      normalizedLemma,
      ...(suggestion.proposedPartOfSpeech
        ? { proposedPartOfSpeech: suggestion.proposedPartOfSpeech }
        : {}),
      lexicalStatus,
      ...(selectedSense ? { selectedSense } : {}),
      availableSenses: senses,
      selectionReasons: suggestion.selectionReasons ?? ["suggested-by-local-ai"],
    });
  }

  return { candidates, rejected, strategy: "suggest-verify-select" };
}
