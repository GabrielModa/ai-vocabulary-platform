import { resolveCandidateSense, type ReviewCandidate } from "./lexical-review";

const STORAGE_KEY = "lexi.sense-preferences.v1";

export type SensePreferences = Readonly<Record<string, string>>;

function normalizeTerm(value: string): string {
  return value.normalize("NFKC").toLocaleLowerCase("en-US").replace(/\s+/gu, " ").trim();
}

export function readSensePreferences(storage: Pick<Storage, "getItem">): SensePreferences {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return {};

    const parsed: unknown = JSON.parse(raw);
    if (parsed === null || typeof parsed !== "object") return {};

    return Object.fromEntries(
      Object.entries(parsed).filter(
        (entry): entry is [string, string] =>
          typeof entry[1] === "string" && entry[1].trim().length > 0,
      ),
    );
  } catch {
    return {};
  }
}

export function writeSensePreference(
  storage: Pick<Storage, "getItem" | "setItem">,
  term: string,
  senseId: string,
): SensePreferences {
  const next = {
    ...readSensePreferences(storage),
    [normalizeTerm(term)]: senseId,
  };

  storage.setItem(STORAGE_KEY, JSON.stringify(next));

  return next;
}

export function applySensePreference(
  candidate: ReviewCandidate,
  preferences: SensePreferences,
): ReviewCandidate {
  const senseId = preferences[normalizeTerm(candidate.term)];

  if (!senseId) {
    return candidate;
  }

  try {
    return resolveCandidateSense(candidate, senseId);
  } catch {
    // A saved preference can become stale if lexical data changes.
    // In that case preserve the newly generated candidate unchanged.
    return candidate;
  }
}
