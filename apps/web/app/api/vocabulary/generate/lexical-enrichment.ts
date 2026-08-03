import type { LocalVocabularySet } from "@vocabulary/ai";
import {
  lexicalContentSchema,
  OewnLexicalProvider,
  type LexicalContent,
} from "@vocabulary/domain-vocabulary";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

export interface LexicalLookup {
  lookup(request: { readonly word: string; readonly language: string }): Promise<unknown>;
}

type GeneratedCandidate = LocalVocabularySet["candidates"][number];

export type EnrichedCandidate = GeneratedCandidate & {
  readonly lexicalValidationStatus: "verified" | "provisional" | "unavailable";
  readonly senseId?: string;
  readonly lexicalProvenance?: LexicalContent["provenance"];
  readonly lexicalSenses?: readonly LexicalContent[];
};

export interface EnrichedVocabularySet extends Omit<LocalVocabularySet, "candidates"> {
  readonly candidates: readonly EnrichedCandidate[];
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

async function enrichCandidate(
  candidate: LocalVocabularySet["candidates"][number],
  lookup: LexicalLookup | undefined,
): Promise<EnrichedCandidate> {
  if (!lookup) return { ...candidate, lexicalValidationStatus: "unavailable" };
  let senses: readonly LexicalContent[];
  try {
    const result = await lookup.lookup({ word: candidate.term, language: "en" });
    if (!Array.isArray(result) || result.length > 100) throw new Error("Invalid lexical result");
    senses = result.map((sense) => lexicalContentSchema.parse(sense));
  } catch {
    return { ...candidate, lexicalValidationStatus: "unavailable" };
  }
  if (senses.length === 0) return { ...candidate, lexicalValidationStatus: "unavailable" };
  const compatible = senses.filter((sense) => sense.partOfSpeech === candidate.type);
  const resolved = compatible.length === 1 ? compatible[0] : undefined;
  if (resolved?.definition) {
    return {
      ...candidate,
      meaning: resolved.definition,
      lexicalValidationStatus: "verified",
      senseId: resolved.senseId,
      lexicalProvenance: resolved.provenance,
      lexicalSenses: senses,
    };
  }
  return { ...candidate, lexicalValidationStatus: "provisional", lexicalSenses: senses };
}

export async function enrichVocabularySet(
  vocabularySet: LocalVocabularySet,
  lookup: LexicalLookup | undefined,
): Promise<EnrichedVocabularySet> {
  return {
    ...vocabularySet,
    candidates: await Promise.all(
      vocabularySet.candidates.map((candidate) => enrichCandidate(candidate, lookup)),
    ),
  };
}
