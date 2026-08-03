import type { LocalVocabularySet } from "@vocabulary/ai";
import {
  buildVerifiedCandidatePipeline,
  OewnLexicalProvider,
  rankLearningCandidates,
  type CandidateLexicalLookup,
  type CandidateScoreContribution,
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
  readonly rank: number;
  readonly rankingScore: number;
  readonly rankingContributions: readonly CandidateScoreContribution[];
  readonly senseId?: string;
  readonly lexicalProvenance?: LexicalContent["provenance"];
  readonly lexicalSenses?: readonly LexicalContent[];
  readonly exerciseKind?: ExerciseKind;
};

export interface EnrichedVocabularySet extends Omit<LocalVocabularySet, "candidates"> {
  readonly candidates: readonly EnrichedCandidate[];
  readonly candidateStrategy: "suggest-verify-select";
  readonly rankingStrategy: "deterministic-weighted-ranking";
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
  ranking: {
    readonly rank: number;
    readonly score: number;
    readonly contributions: readonly CandidateScoreContribution[];
  },
): EnrichedCandidate {
  const base = {
    ...generated,
    candidateId: candidate.candidateId,
    normalizedLemma: candidate.normalizedLemma,
    selectionReasons: candidate.selectionReasons,
    lexicalSenses: candidate.availableSenses,
    rank: ranking.rank,
    rankingScore: ranking.score,
    rankingContributions: ranking.contributions,
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

function generatedCandidateKey(candidate: {
  readonly term: string;
  readonly type?: string;
}): string {
  return `${candidate.term
    .normalize("NFKC")
    .toLocaleLowerCase("en-US")
    .replace(/\s+/gu, " ")
    .trim()}:${candidate.type ?? "unknown"}`;
}

export async function enrichVocabularySet(
  vocabularySet: LocalVocabularySet,
  lookup: LexicalLookup | undefined,
): Promise<EnrichedVocabularySet> {
  const generatedByKey = new Map<string, GeneratedCandidate[]>();
  for (const candidate of vocabularySet.candidates) {
    const key = generatedCandidateKey(candidate);
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

  const ranking = rankLearningCandidates(pipeline.candidates.map((candidate) => ({ candidate })));

  const candidates = ranking.ranked.flatMap((ranked) => {
    const key = generatedCandidateKey({
      term: ranked.candidate.normalizedLemma,
      ...(ranked.candidate.proposedPartOfSpeech
        ? { type: ranked.candidate.proposedPartOfSpeech }
        : {}),
    });
    const generated = generatedByKey.get(key)?.shift();
    return generated ? [adaptCandidate(generated, ranked.candidate, ranked)] : [];
  });

  return {
    ...vocabularySet,
    candidates,
    candidateStrategy: pipeline.strategy,
    rankingStrategy: ranking.strategy,
    rejectedCandidates: pipeline.rejected,
  };
}
