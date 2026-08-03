import type { LocalVocabularySet } from "@vocabulary/ai";
import {
  buildVerifiedCandidatePipeline,
  OewnExampleProvider,
  OewnLexicalProvider,
  rankLearningCandidates,
  SubtlexFrequencyProvider,
  exampleContentSchema,
  frequencyContentSchema,
  type CandidateLexicalLookup,
  type CandidateScoreContribution,
  type ExampleContent,
  type ExampleProvider,
  type FrequencyContent,
  type FrequencyProvider,
  type LearningCandidate,
  type LexicalContent,
} from "@vocabulary/domain-vocabulary";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { definitionRecallChallenge, type ExerciseKind } from "../../../sense-bound-exercise";

export type LexicalLookup = CandidateLexicalLookup;
export type FrequencyLookup = FrequencyProvider;
export type ExampleLookup = ExampleProvider;

type GeneratedCandidate = LocalVocabularySet["candidates"][number];

export type EnrichedCandidate = GeneratedCandidate & {
  readonly candidateId: string;
  readonly normalizedLemma: string;
  readonly selectionReasons: readonly string[];
  readonly lexicalValidationStatus: "verified" | "provisional" | "unavailable";
  readonly rank: number;
  readonly rankingScore: number;
  readonly rankingContributions: readonly CandidateScoreContribution[];
  readonly frequencyPercentile?: number;
  readonly frequencyPerMillion?: number;
  readonly frequencyProvenance?: FrequencyContent["provenance"];
  readonly verifiedExamples?: readonly ExampleContent[];
  readonly exampleProvenance?: ExampleContent["provenance"];
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

let cachedLexicalLookup: Promise<LexicalLookup> | undefined;
let cachedFrequencyLookup: Promise<FrequencyLookup> | undefined;
let cachedExampleLookup: Promise<ExampleLookup> | undefined;

function lexicalIndexCandidates(): readonly string[] {
  if (process.env.OEWN_INDEX_PATH) return [resolve(process.env.OEWN_INDEX_PATH)];
  return [
    resolve(process.cwd(), "data/oewn/index.json"),
    resolve(process.cwd(), "../../data/oewn/index.json"),
  ];
}

function frequencyIndexCandidates(): readonly string[] {
  if (process.env.SUBTLEX_INDEX_PATH) return [resolve(process.env.SUBTLEX_INDEX_PATH)];
  return [
    resolve(process.cwd(), "data/subtlex/index.json"),
    resolve(process.cwd(), "../../data/subtlex/index.json"),
  ];
}

function exampleIndexCandidates(): readonly string[] {
  if (process.env.OEWN_EXAMPLES_INDEX_PATH) return [resolve(process.env.OEWN_EXAMPLES_INDEX_PATH)];
  return [
    resolve(process.cwd(), "data/oewn/examples.json"),
    resolve(process.cwd(), "../../data/oewn/examples.json"),
  ];
}

async function readFirstIndex(
  paths: readonly string[],
  unavailableMessage: string,
): Promise<unknown> {
  let lastError: unknown;
  for (const path of paths) {
    try {
      return JSON.parse(await readFile(path, "utf8"));
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError instanceof Error ? lastError : new Error(unavailableMessage);
}

export async function loadLocalLexicalLookup(): Promise<LexicalLookup | undefined> {
  cachedLexicalLookup ??= readFirstIndex(lexicalIndexCandidates(), "OEWN index unavailable")
    .then((index) => new OewnLexicalProvider(index))
    .catch((error: unknown) => {
      cachedLexicalLookup = undefined;
      throw error;
    });
  try {
    return await cachedLexicalLookup;
  } catch {
    return undefined;
  }
}

export async function loadLocalFrequencyLookup(): Promise<FrequencyLookup | undefined> {
  cachedFrequencyLookup ??= readFirstIndex(frequencyIndexCandidates(), "SUBTLEX index unavailable")
    .then((index) => new SubtlexFrequencyProvider(index))
    .catch((error: unknown) => {
      cachedFrequencyLookup = undefined;
      throw error;
    });
  try {
    return await cachedFrequencyLookup;
  } catch {
    return undefined;
  }
}

export async function loadLocalExampleLookup(): Promise<ExampleLookup | undefined> {
  cachedExampleLookup ??= readFirstIndex(
    exampleIndexCandidates(),
    "OEWN examples index unavailable",
  )
    .then((index) => new OewnExampleProvider(index))
    .catch((error: unknown) => {
      cachedExampleLookup = undefined;
      throw error;
    });
  try {
    return await cachedExampleLookup;
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
  frequency: FrequencyContent | undefined,
  examples: readonly ExampleContent[],
): EnrichedCandidate {
  const firstExample = examples[0];
  const base = {
    ...generated,
    ...(firstExample
      ? {
          example: firstExample.sentence,
          verifiedExamples: examples,
          exampleProvenance: firstExample.provenance,
        }
      : {}),
    candidateId: candidate.candidateId,
    normalizedLemma: candidate.normalizedLemma,
    selectionReasons: candidate.selectionReasons,
    lexicalSenses: candidate.availableSenses,
    rank: ranking.rank,
    rankingScore: ranking.score,
    rankingContributions: ranking.contributions,
    ...(frequency
      ? {
          frequencyPercentile: frequency.percentile,
          frequencyPerMillion: frequency.frequencyPerMillion,
          frequencyProvenance: frequency.provenance,
        }
      : {}),
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
  return `${candidate.term.normalize("NFKC").toLocaleLowerCase("en-US").replace(/\s+/gu, " ").trim()}:${candidate.type ?? "unknown"}`;
}

async function lookupFrequency(
  provider: FrequencyLookup | undefined,
  word: string,
): Promise<FrequencyContent | undefined> {
  if (!provider) return undefined;
  try {
    const result = await provider.lookup({ word, language: "en-US" });
    return result === undefined ? undefined : frequencyContentSchema.parse(result);
  } catch {
    return undefined;
  }
}

async function lookupExamples(
  provider: ExampleLookup | undefined,
  senseId: string | undefined,
): Promise<readonly ExampleContent[]> {
  if (!provider || !senseId) return [];
  try {
    const result = await provider.find({ senseId });
    if (!Array.isArray(result)) return [];
    return Object.freeze(result.map((example) => exampleContentSchema.parse(example)));
  } catch {
    return [];
  }
}

export async function enrichVocabularySet(
  vocabularySet: LocalVocabularySet,
  lexicalLookup: LexicalLookup | undefined,
  frequencyLookup?: FrequencyLookup,
  exampleLookup?: ExampleLookup,
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
    lexicalLookup,
  );

  const [frequencies, examples] = await Promise.all([
    Promise.all(
      pipeline.candidates.map((candidate) =>
        lookupFrequency(frequencyLookup, candidate.normalizedLemma),
      ),
    ),
    Promise.all(
      pipeline.candidates.map((candidate) =>
        lookupExamples(exampleLookup, candidate.selectedSense?.senseId),
      ),
    ),
  ]);

  const frequencyByCandidateId = new Map(
    pipeline.candidates.map((candidate, index) => [candidate.candidateId, frequencies[index]]),
  );
  const examplesByCandidateId = new Map(
    pipeline.candidates.map((candidate, index) => [candidate.candidateId, examples[index] ?? []]),
  );

  const ranking = rankLearningCandidates(
    pipeline.candidates.map((candidate) => {
      const frequency = frequencyByCandidateId.get(candidate.candidateId);
      return {
        candidate,
        ...(frequency ? { evidence: { frequencyPercentile: frequency.percentile } } : {}),
      };
    }),
  );

  const candidates = ranking.ranked.flatMap((ranked) => {
    const key = generatedCandidateKey({
      term: ranked.candidate.normalizedLemma,
      ...(ranked.candidate.proposedPartOfSpeech
        ? { type: ranked.candidate.proposedPartOfSpeech }
        : {}),
    });
    const generated = generatedByKey.get(key)?.shift();
    return generated
      ? [
          adaptCandidate(
            generated,
            ranked.candidate,
            ranked,
            frequencyByCandidateId.get(ranked.candidate.candidateId),
            examplesByCandidateId.get(ranked.candidate.candidateId) ?? [],
          ),
        ]
      : [];
  });

  return {
    ...vocabularySet,
    candidates,
    candidateStrategy: pipeline.strategy,
    rankingStrategy: ranking.strategy,
    rejectedCandidates: pipeline.rejected,
  };
}
