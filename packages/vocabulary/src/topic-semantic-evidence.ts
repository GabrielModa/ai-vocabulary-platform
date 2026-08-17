const EVIDENCE_VERSION = "2026-08-17.1";
const LITERAL_TOPIC_WEIGHT = 4;
const REVIEWED_CONCEPT_WEIGHT = 2;

const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "for",
  "in",
  "of",
  "on",
  "the",
  "to",
  "vocabulary",
  "with",
]);

const PROFILES = {
  education: [
    "academic",
    "assessment",
    "curriculum",
    "exam",
    "grade",
    "learn",
    "lesson",
    "school",
    "student",
    "study",
    "subject",
    "teacher",
  ],
  environment: [
    "animal",
    "climate",
    "conservation",
    "ecological",
    "emission",
    "nature",
    "pollution",
    "recycle",
    "sustainable",
    "waste",
    "water",
    "weather",
  ],
  family: [
    "child",
    "generation",
    "guardian",
    "household",
    "kinship",
    "parent",
    "relative",
    "relationship",
    "sibling",
    "upbringing",
  ],
  football: [
    "athlete",
    "ball",
    "coach",
    "competition",
    "foul",
    "game",
    "goal",
    "match",
    "player",
    "position",
    "referee",
    "rule",
    "score",
    "soccer",
    "spatial",
    "sport",
    "sports",
    "tactical",
    "team",
  ],
  health: [
    "appointment",
    "body",
    "chronic",
    "diagnosis",
    "doctor",
    "medical",
    "medicine",
    "patient",
    "prevention",
    "recover",
    "symptom",
    "treatment",
  ],
  home: [
    "appliance",
    "dwelling",
    "furniture",
    "house",
    "household",
    "landlord",
    "neighborhood",
    "renovate",
    "rent",
    "repair",
    "room",
  ],
  kitchen: [
    "cook",
    "cooking",
    "food",
    "ingredient",
    "meal",
    "recipe",
    "salt",
    "seasoning",
    "spice",
    "utensil",
  ],
  money: [
    "asset",
    "bank",
    "borrow",
    "budget",
    "cost",
    "debt",
    "deposit",
    "financial",
    "income",
    "interest",
    "invest",
    "payment",
  ],
  shopping: [
    "bargain",
    "consumer",
    "discount",
    "price",
    "purchase",
    "receipt",
    "refund",
    "retail",
    "shop",
    "store",
    "warranty",
  ],
  technology: [
    "algorithm",
    "code",
    "computer",
    "data",
    "database",
    "device",
    "digital",
    "encrypt",
    "information",
    "network",
    "software",
    "website",
  ],
  travel: [
    "accommodation",
    "arrival",
    "departure",
    "destination",
    "hotel",
    "itinerary",
    "journey",
    "luggage",
    "route",
    "tourism",
    "tourist",
    "transport",
    "trip",
  ],
  work: [
    "business",
    "career",
    "colleague",
    "deadline",
    "employee",
    "employer",
    "job",
    "management",
    "office",
    "professional",
    "responsibility",
    "salary",
    "task",
    "workplace",
  ],
} as const;

export type TrustedSemanticTopic = keyof typeof PROFILES;

const ALIASES: Readonly<Record<string, TrustedSemanticTopic>> = {
  climate: "environment",
  cooking: "kitchen",
  education: "education",
  environment: "environment",
  family: "family",
  finance: "money",
  football: "football",
  health: "health",
  healthcare: "health",
  home: "home",
  housing: "home",
  kitchen: "kitchen",
  money: "money",
  relatives: "family",
  retail: "shopping",
  shopping: "shopping",
  soccer: "football",
  tech: "technology",
  technology: "technology",
  tourism: "travel",
  travel: "travel",
  work: "work",
  workplace: "work",
};

export function semanticTokens(value: string): ReadonlySet<string> {
  return new Set(
    value
      .normalize("NFKC")
      .toLocaleLowerCase("en-US")
      .split(/[^\p{L}\p{N}]+/u)
      .filter((token) => token.length > 2 && !STOP_WORDS.has(token)),
  );
}

export interface TopicSemanticEvidence {
  readonly version: string;
  readonly profile?: TrustedSemanticTopic;
  readonly tokenCount: number;
  weightFor(token: string): number;
}

export function resolveTrustedSemanticTopic(topic: string): TrustedSemanticTopic | undefined {
  const literalTokens = semanticTokens(topic);
  const normalizedTopic = [...literalTokens].join(" ");
  return (
    ALIASES[normalizedTopic] ??
    [...literalTokens].map((token) => ALIASES[token]).find((value) => value !== undefined)
  );
}

/** Returns reviewed topic evidence used only to rank existing verified lexical definitions. */
export function semanticEvidenceForTopic(topic: string): TopicSemanticEvidence {
  const literalTokens = semanticTokens(topic);
  const profile = resolveTrustedSemanticTopic(topic);
  const weights = new Map<string, number>();

  for (const token of literalTokens) weights.set(token, LITERAL_TOPIC_WEIGHT);
  if (profile) {
    for (const concept of PROFILES[profile]) {
      weights.set(concept, Math.max(weights.get(concept) ?? 0, REVIEWED_CONCEPT_WEIGHT));
    }
  }

  return Object.freeze({
    version: EVIDENCE_VERSION,
    ...(profile ? { profile } : {}),
    tokenCount: weights.size,
    weightFor: (token: string) => weights.get(token) ?? 0,
  });
}
