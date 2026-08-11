import type { CefrLevel, VocabularyCandidate } from "./model.js";

type PartOfSpeech = VocabularyCandidate["partOfSpeech"];

const CATALOG_VERSION = "2026-08-12.1";
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

type CatalogTopic =
  "education" | "football" | "health" | "kitchen" | "technology" | "travel" | "work";

const candidate = (
  term: string,
  partOfSpeech: PartOfSpeech,
  cefrHint: CefrLevel,
): TrustedTopicCandidate => ({ term, partOfSpeech, cefrHint });

const CATALOG: Readonly<Record<CatalogTopic, readonly TrustedTopicCandidate[]>> = {
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
    candidate("tackle", "verb", "B1"),
    candidate("substitute", "noun", "B2"),
    candidate("possession", "noun", "B2"),
    candidate("formation", "noun", "B2"),
    candidate("offside", "adjective", "B2"),
    candidate("equalizer", "noun", "C1"),
    candidate("fixture", "noun", "C1"),
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

const ALIASES: Readonly<Record<string, CatalogTopic>> = {
  education: "education",
  football: "football",
  soccer: "football",
  health: "health",
  healthcare: "health",
  kitchen: "kitchen",
  cooking: "kitchen",
  technology: "technology",
  tech: "technology",
  travel: "travel",
  tourism: "travel",
  work: "work",
  workplace: "work",
};

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
  const resolvedTopic = ALIASES[normalize(request.topic)];
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
      const levelDistance =
        Math.abs(LEVEL_ORDER.indexOf(left.entry.cefrHint) - requestedLevelIndex) -
        Math.abs(LEVEL_ORDER.indexOf(right.entry.cefrHint) - requestedLevelIndex);
      return levelDistance || left.position - right.position;
    })
    .slice(0, count)
    .map(({ entry }) => entry);

  return { catalogVersion: CATALOG_VERSION, resolvedTopic, candidates };
}
