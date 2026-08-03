import type { LocalVocabularySet } from "@vocabulary/ai";
import {
  buildVerifiedCandidatePipeline,
  OewnLexicalProvider,
  type CandidateLexicalLookup,
  type LearningCandidate,
  type LexicalContent,
} from "@vocabulary/domain-vocabulary";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { definitionRecallChallenge, type ExerciseKind } from "../../../sense-bound-exercise";

export type LexicalLookup = CandidateLexicalLookup;

type GeneratedCandidate = LocalVocabularySet["candidates"][number];

export type EnrichedCandidate = GeneratedCandidate & {
  readonly candidateId: string;
  readonly normalizedLemma: string;
  readonly selectionReasons: readonly string[];
  readonly lexicalValidationStatus: "verified" | "provisional" | "unavailable";
  readonly senseId?: string;
  readonly lexicalProvenance?: LexicalContent["provenance"];
  readonly lexicalSenses?: readonly LexicalContent[];
  readonly exerciseKind?: ExerciseKind;
};

export interface EnrichedVocabularySet extends Omit<LocalVocabularySet, "candidates"> {
  readonly candidates: readonly EnrichedCandidate[];
  readonly candidateStrategy: "suggest-verify-select";
  readonly rejectedCandidates: readonly {
    readonly term: string;
    readonly normalizedLemma?: string;
    readonly reason: string;
  }[];
}

let cachedLookup: Promise<LexicalLookup> | undefined;

function indexCandidates(): readonly string[] {
  if (process.env.OEWN_INDEX_PATH) return [resolve(process.env.OEWN_INDEX_PATH)];
  return [
    resolve(process.cwd(), "data/oewn/index.json"),
    resolve(process.cwd(), "../../data/oewn/index.json"),
  ];
}

async function readFirstIndex(): Promise<unknown> {
  let lastError: unknown;
  for (const path of indexCandidates()) {
    try {
      return JSON.parse(await readFile(path, "utf8"));
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError instanceof Error ? lastError : new Error("OEWN index unavailable");
}

export async function loadLocalLexicalLookup(): Promise<LexicalLookup | undefined> {
  cachedLookup ??= readFirstIndex()
    .then((index) => new OewnLexicalProvider(index))
    .catch((error: unknown) => {
      cachedLookup = undefined;
      throw error;
    });
  try {
    return await cachedLookup;
  } catch {
    return undefined;
  }
}

function adaptCandidate(
  generated: GeneratedCandidate,
  candidate: LearningCandidate,
): EnrichedCandidate {
  const base = {
    ...generated,
    candidateId: candidate.candidateId,
    normalizedLemma: candidate.normalizedLemma,
    selectionReasons: candidate.selectionReasons,
    lexicalSenses: candidate.availableSenses,
  };

  if (candidate.selectedSense) {
    return {
      ...base,
      meaning: candidate.selectedSense.definition,
      challenge: definitionRecallChallenge(candidate.selectedSense.definition),
      exerciseKind: "definition-choice",
      lexicalValidationStatus: "verified",
      senseId: candidate.selectedSense.senseId,
      lexicalProvenance: candidate.selectedSense.provenance,
    };
  }

  return {
    ...base,
    lexicalValidationStatus:
      candidate.lexicalStatus === "unavailable" ? "unavailable" : "provisional",
  };
}

export async function enrichVocabularySet(
  vocabularySet: LocalVocabularySet,
  lookup: LexicalLookup | undefined,
): Promise<EnrichedVocabularySet> {
  const generatedByKey = new Map<string, GeneratedCandidate[]>();
  for (const candidate of vocabularySet.candidates) {
    const key = `${candidate.term.normalize("NFKC").toLocaleLowerCase("en-US").replace(/\s+/gu, " ").trim()}:${candidate.type}`;
    generatedByKey.set(key, [...(generatedByKey.get(key) ?? []), candidate]);
  }

  const pipeline = await buildVerifiedCandidatePipeline(
    vocabularySet.candidates.map((candidate) => ({
      term: candidate.term,
      proposedPartOfSpeech: candidate.type,
      selectionReasons: ["suggested-by-local-ai", "matched-request-context"],
    })),
    lookup,
  );

  const candidates = pipeline.candidates.flatMap((candidate) => {
    const key = `${candidate.normalizedLemma}:${candidate.proposedPartOfSpeech ?? "unknown"}`;
    const generated = generatedByKey.get(key)?.shift();
    return generated ? [adaptCandidate(generated, candidate)] : [];
  });

  return {
    ...vocabularySet,
    candidates,
    candidateStrategy: pipeline.strategy,
    rejectedCandidates: pipeline.rejected,
  };
}
