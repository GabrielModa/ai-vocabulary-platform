import type { CefrLevel, VocabularyCandidate } from "./model.js";
import {
  resolveTrustedSemanticTopic,
  type TrustedSemanticTopic,
} from "./topic-semantic-evidence.js";

type PartOfSpeech = VocabularyCandidate["partOfSpeech"];

const CATALOG_VERSION = "2026-08-18.1";
const LEVEL_ORDER: readonly CefrLevel[] = ["A2", "B1", "B2", "C1", "C2"];

export interface TrustedTopicCandidate {
  readonly term: string;
  readonly partOfSpeech: PartOfSpeech;
  readonly cefrHint: CefrLevel;
}

export interface TrustedTopicCandidateRequest {
  readonly topic: string;
  readonly level: CefrLevel;
  readonly count: number;
  readonly excludedTerms?: readonly string[];
}

export interface TrustedTopicCandidateResult {
  readonly catalogVersion: string;
  readonly resolvedTopic: string;
  readonly candidates: readonly TrustedTopicCandidate[];
}

export interface TrustedDistractorCandidateResult {
  readonly catalogVersion: string;
  readonly candidates: readonly TrustedTopicCandidate[];
}

type CatalogTopic = TrustedSemanticTopic;

const candidate = (
  term: string,
  partOfSpeech: PartOfSpeech,
  cefrHint: CefrLevel,
): TrustedTopicCandidate => ({ term, partOfSpeech, cefrHint });

const CATALOG: Readonly<Record<CatalogTopic, readonly TrustedTopicCandidate[]>> = {
  family: [
    candidate("parent", "noun", "A2"),
    candidate("child", "noun", "A2"),
    candidate("brother", "noun", "A2"),
    candidate("sister", "noun", "A2"),
    candidate("relative", "noun", "B1"),
    candidate("sibling", "noun", "B1"),
    candidate("household", "noun", "B1"),
    candidate("generation", "noun", "B1"),
    candidate("guardian", "noun", "B2"),
    candidate("upbringing", "noun", "B2"),
    candidate("inherit", "verb", "B2"),
    candidate("estranged", "adjective", "C1"),
    candidate("kinship", "noun", "C1"),
    candidate("lineage", "noun", "C2"),
  ],
  shopping: [
    candidate("shop", "noun", "A2"),
    candidate("price", "noun", "A2"),
    candidate("cash", "noun", "A2"),
    candidate("cheap", "adjective", "A2"),
    candidate("receipt", "noun", "B1"),
    candidate("refund", "noun", "B1"),
    candidate("bargain", "noun", "B1"),
    candidate("afford", "verb", "B1"),
    candidate("retailer", "noun", "B2"),
    candidate("discount", "noun", "B2"),
    candidate("purchase", "verb", "B2"),
    candidate("warranty", "noun", "B2"),
    candidate("counterfeit", "adjective", "C1"),
    candidate("consumerism", "noun", "C1"),
  ],
  home: [
    candidate("room", "noun", "A2"),
    candidate("chair", "noun", "A2"),
    candidate("window", "noun", "A2"),
    candidate("clean", "verb", "A2"),
    candidate("furniture", "noun", "B1"),
    candidate("rent", "verb", "B1"),
    candidate("repair", "verb", "B1"),
    candidate("neighborhood", "noun", "B1"),
    candidate("appliance", "noun", "B2"),
    candidate("renovate", "verb", "B2"),
    candidate("mortgage", "noun", "B2"),
    candidate("landlord", "noun", "B2"),
    candidate("dwelling", "noun", "C1"),
    candidate("refurbishment", "noun", "C1"),
  ],
  environment: [
    candidate("tree", "noun", "A2"),
    candidate("water", "noun", "A2"),
    candidate("animal", "noun", "A2"),
    candidate("weather", "noun", "A2"),
    candidate("pollution", "noun", "B1"),
    candidate("recycle", "verb", "B1"),
    candidate("climate", "noun", "B1"),
    candidate("waste", "noun", "B1"),
    candidate("sustainable", "adjective", "B2"),
    candidate("emission", "noun", "B2"),
    candidate("conservation", "noun", "B2"),
    candidate("renewable", "adjective", "B2"),
    candidate("biodiversity", "noun", "C1"),
    candidate("degradation", "noun", "C1"),
  ],
  money: [
    candidate("money", "noun", "A2"),
    candidate("bank", "noun", "A2"),
    candidate("pay", "verb", "A2"),
    candidate("cost", "noun", "A2"),
    candidate("budget", "noun", "B1"),
    candidate("save", "verb", "B1"),
    candidate("borrow", "verb", "B1"),
    candidate("debt", "noun", "B1"),
    candidate("invest", "verb", "B2"),
    candidate("income", "noun", "B2"),
    candidate("interest", "noun", "B2"),
    candidate("asset", "noun", "B2"),
    candidate("inflation", "noun", "C1"),
    candidate("liquidity", "noun", "C1"),
  ],
  football: [
    candidate("ball", "noun", "A2"),
    candidate("team", "noun", "A2"),
    candidate("player", "noun", "A2"),
    candidate("match", "noun", "A2"),
    candidate("score", "verb", "A2"),
    candidate("goal", "noun", "A2"),
    candidate("coach", "noun", "B1"),
    candidate("referee", "noun", "B1"),
    candidate("penalty", "noun", "B1"),
    candidate("offside", "adjective", "B1"),
    candidate("foul", "noun", "B1"),
    candidate("header", "noun", "B1"),
    candidate("possession", "noun", "B2"),
    candidate("equalizer", "noun", "B2"),
    candidate("substitute", "noun", "B2"),
    candidate("formation", "noun", "B2"),
    candidate("tackle", "verb", "B2"),
    candidate("concede", "verb", "B2"),
    candidate("retain", "verb", "B2"),
    candidate("clinical", "adjective", "B2"),
    candidate("fixture", "noun", "B2"),
    candidate("dominate", "verb", "B2"),
    candidate("counterattack", "noun", "C1"),
    candidate("playmaker", "noun", "C1"),
    candidate("pressing", "noun", "C1"),
    candidate("overlap", "verb", "C1"),
  ],
  work: [
    candidate("job", "noun", "A2"),
    candidate("office", "noun", "A2"),
    candidate("boss", "noun", "A2"),
    candidate("meeting", "noun", "A2"),
    candidate("colleague", "noun", "B1"),
    candidate("salary", "noun", "B1"),
    candidate("deadline", "noun", "B1"),
    candidate("promotion", "noun", "B1"),
    candidate("workload", "noun", "B2"),
    candidate("resign", "verb", "B2"),
    candidate("negotiate", "verb", "B2"),
    candidate("recruit", "verb", "B2"),
    candidate("delegate", "verb", "C1"),
    candidate("stakeholder", "noun", "C1"),
    candidate("appraisal", "noun", "C1"),
    candidate("remuneration", "noun", "C2"),
  ],
  travel: [
    candidate("ticket", "noun", "A2"),
    candidate("hotel", "noun", "A2"),
    candidate("train", "noun", "A2"),
    candidate("journey", "noun", "A2"),
    candidate("luggage", "noun", "B1"),
    candidate("departure", "noun", "B1"),
    candidate("destination", "noun", "B1"),
    candidate("book", "verb", "B1"),
    candidate("itinerary", "noun", "B2"),
    candidate("layover", "noun", "B2"),
    candidate("accommodation", "noun", "B2"),
    candidate("sightseeing", "noun", "B2"),
    candidate("embark", "verb", "C1"),
    candidate("excursion", "noun", "C1"),
  ],
  kitchen: [
    candidate("plate", "noun", "A2"),
    candidate("spoon", "noun", "A2"),
    candidate("knife", "noun", "A2"),
    candidate("cook", "verb", "A2"),
    candidate("recipe", "noun", "B1"),
    candidate("ingredient", "noun", "B1"),
    candidate("boil", "verb", "B1"),
    candidate("slice", "verb", "B1"),
    candidate("whisk", "verb", "B2"),
    candidate("simmer", "verb", "B2"),
    candidate("seasoning", "noun", "B2"),
    candidate("utensil", "noun", "B2"),
    candidate("marinate", "verb", "C1"),
    candidate("caramelize", "verb", "C1"),
  ],
  technology: [
    candidate("screen", "noun", "A2"),
    candidate("phone", "noun", "A2"),
    candidate("computer", "noun", "A2"),
    candidate("website", "noun", "A2"),
    candidate("password", "noun", "B1"),
    candidate("download", "verb", "B1"),
    candidate("device", "noun", "B1"),
    candidate("software", "noun", "B1"),
    candidate("database", "noun", "B2"),
    candidate("encrypt", "verb", "B2"),
    candidate("algorithm", "noun", "B2"),
    candidate("bandwidth", "noun", "B2"),
    candidate("interoperability", "noun", "C1"),
    candidate("decentralized", "adjective", "C1"),
  ],
  health: [
    candidate("doctor", "noun", "A2"),
    candidate("medicine", "noun", "A2"),
    candidate("pain", "noun", "A2"),
    candidate("healthy", "adjective", "A2"),
    candidate("symptom", "noun", "B1"),
    candidate("treatment", "noun", "B1"),
    candidate("recover", "verb", "B1"),
    candidate("appointment", "noun", "B1"),
    candidate("diagnosis", "noun", "B2"),
    candidate("prescribe", "verb", "B2"),
    candidate("chronic", "adjective", "B2"),
    candidate("prevention", "noun", "B2"),
    candidate("prognosis", "noun", "C1"),
    candidate("rehabilitation", "noun", "C1"),
  ],
  education: [
    candidate("school", "noun", "A2"),
    candidate("teacher", "noun", "A2"),
    candidate("lesson", "noun", "A2"),
    candidate("learn", "verb", "A2"),
    candidate("subject", "noun", "B1"),
    candidate("exam", "noun", "B1"),
    candidate("grade", "noun", "B1"),
    candidate("revise", "verb", "B1"),
    candidate("curriculum", "noun", "B2"),
    candidate("assessment", "noun", "B2"),
    candidate("scholarship", "noun", "B2"),
    candidate("compulsory", "adjective", "B2"),
    candidate("pedagogy", "noun", "C1"),
    candidate("accreditation", "noun", "C1"),
  ],
};

export interface TrustedTopicCoverage {
  readonly topic: string;
  readonly candidateCount: number;
  readonly levels: Readonly<Record<CefrLevel, number>>;
}

export function listTrustedTopicCoverage(): readonly TrustedTopicCoverage[] {
  return Object.freeze(
    (Object.entries(CATALOG) as [CatalogTopic, readonly TrustedTopicCandidate[]][])
      .sort(([left], [right]) => left.localeCompare(right, "en"))
      .map(([topic, candidates]) => {
        const levels: Record<CefrLevel, number> = { A2: 0, B1: 0, B2: 0, C1: 0, C2: 0 };
        for (const entry of candidates) levels[entry.cefrHint] += 1;
        return Object.freeze({
          topic,
          candidateCount: candidates.length,
          levels: Object.freeze(levels),
        });
      }),
  );
}

const normalize = (value: string): string =>
  value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

export function suggestTrustedTopicCandidates(
  request: TrustedTopicCandidateRequest,
): TrustedTopicCandidateResult | undefined {
  const resolvedTopic = resolveTrustedSemanticTopic(request.topic);
  if (!resolvedTopic) return undefined;

  const requestedLevelIndex = LEVEL_ORDER.indexOf(request.level);
  const exclusions = new Set((request.excludedTerms ?? []).map(normalize));
  const seen = new Set<string>();
  const count = Math.max(0, Math.min(100, Math.trunc(request.count)));
  const candidates = CATALOG[resolvedTopic]
    .map((entry, position) => ({ entry, position }))
    .filter(({ entry }) => {
      const normalizedTerm = normalize(entry.term);
      if (exclusions.has(normalizedTerm) || seen.has(normalizedTerm)) return false;
      seen.add(normalizedTerm);
      return true;
    })
    .sort((left, right) => {
      const levelPriority = (level: CefrLevel): number => {
        const difference = LEVEL_ORDER.indexOf(level) - requestedLevelIndex;
        if (difference === 0) return 0;
        return difference > 0 ? difference * 2 - 1 : Math.abs(difference) * 2;
      };
      return (
        levelPriority(left.entry.cefrHint) - levelPriority(right.entry.cefrHint) ||
        left.position - right.position
      );
    })
    .slice(0, count)
    .map(({ entry }) => entry);

  return { catalogVersion: CATALOG_VERSION, resolvedTopic, candidates };
}

const DISTRACTOR_PART_OF_SPEECH_ORDER: readonly PartOfSpeech[] = [
  "noun",
  "verb",
  "adjective",
  "adverb",
  "phrasal-verb",
  "collocation",
  "expression",
  "other",
];

/**
 * Builds a hidden, deterministic reserve from the complete curated catalog.
 * Topic-local entries remain preferred inside each part of speech, while round-robin selection
 * prevents the noun-heavy catalog from starving verbs and adjectives.
 */
export function suggestTrustedDistractorCandidates(
  request: TrustedTopicCandidateRequest,
): TrustedDistractorCandidateResult {
  const resolvedTopic = resolveTrustedSemanticTopic(request.topic);
  const requestedLevelIndex = LEVEL_ORDER.indexOf(request.level);
  const exclusions = new Set((request.excludedTerms ?? []).map(normalize));
  const count = Math.max(0, Math.min(100, Math.trunc(request.count)));
  const seen = new Set<string>();

  const ranked = (Object.entries(CATALOG) as [CatalogTopic, readonly TrustedTopicCandidate[]][])
    .flatMap(([topic, candidates]) =>
      candidates.map((entry, position) => ({ entry, position, topic })),
    )
    .filter(({ entry }) => {
      const term = normalize(entry.term);
      if (exclusions.has(term) || seen.has(term)) return false;
      seen.add(term);
      return true;
    })
    .sort((left, right) => {
      const levelDistance =
        Math.abs(LEVEL_ORDER.indexOf(left.entry.cefrHint) - requestedLevelIndex) -
        Math.abs(LEVEL_ORDER.indexOf(right.entry.cefrHint) - requestedLevelIndex);
      if (levelDistance !== 0) return levelDistance;
      const leftIsLocal = left.topic === resolvedTopic;
      const rightIsLocal = right.topic === resolvedTopic;
      if (leftIsLocal !== rightIsLocal) return leftIsLocal ? -1 : 1;
      const topicOrder = left.topic.localeCompare(right.topic, "en");
      return topicOrder || left.position - right.position;
    });

  const queues = new Map<PartOfSpeech, TrustedTopicCandidate[]>();
  for (const { entry } of ranked) {
    const queue = queues.get(entry.partOfSpeech) ?? [];
    queue.push(entry);
    queues.set(entry.partOfSpeech, queue);
  }

  const candidates: TrustedTopicCandidate[] = [];
  while (candidates.length < count) {
    let selectedInRound = false;
    for (const partOfSpeech of DISTRACTOR_PART_OF_SPEECH_ORDER) {
      const next = queues.get(partOfSpeech)?.shift();
      if (next === undefined) continue;
      candidates.push(next);
      selectedInRound = true;
      if (candidates.length === count) break;
    }
    if (!selectedInRound) break;
  }

  return Object.freeze({
    catalogVersion: CATALOG_VERSION,
    candidates: Object.freeze(candidates),
  });
}
