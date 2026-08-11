import { z } from "zod";
import { pronunciationContentSchema, type PronunciationContent } from "./providers.js";

const vowels = new Set([
  "AA",
  "AE",
  "AH",
  "AO",
  "AW",
  "AY",
  "EH",
  "ER",
  "EY",
  "IH",
  "IY",
  "OW",
  "OY",
  "UH",
  "UW",
]);
const consonants = new Set([
  "B",
  "CH",
  "D",
  "DH",
  "F",
  "G",
  "HH",
  "JH",
  "K",
  "L",
  "M",
  "N",
  "NG",
  "P",
  "R",
  "S",
  "SH",
  "T",
  "TH",
  "V",
  "W",
  "Y",
  "Z",
  "ZH",
]);

const metadataSchema = z
  .object({
    provider: z.literal("cmu-pronouncing-dictionary"),
    sourceVersion: z.string().trim().min(1).max(200),
    sourceUrl: z.url(),
    license: z.string().trim().min(1).max(2_000),
    attribution: z.string().trim().min(1).max(2_000),
    retrievedAt: z.iso.datetime({ offset: true }),
  })
  .strict();

const pronunciationSchema = z.union([
  z.string().trim().min(1).max(500),
  z.array(z.string().trim().min(1).max(10)).min(1).max(100),
]);

const datasetSchema = z
  .object({
    metadata: metadataSchema,
    entries: z.record(z.string().trim().min(1).max(200), z.array(pronunciationSchema).min(1)),
  })
  .strict();

function normalizeWord(value: string): string {
  return value.normalize("NFKC").toLocaleLowerCase("en-US").replace(/\s+/gu, " ").trim();
}

function validateTranscription(value: string | readonly string[]): string {
  const phones = typeof value === "string" ? value.split(/\s+/u) : [...value];
  for (const phone of phones) {
    const match = /^([A-Z]+)([012]?)$/u.exec(phone);
    if (!match) throw new Error(`Invalid CMUdict phoneme: ${phone}`);
    const [, symbol, stress] = match;
    if (vowels.has(symbol ?? "")) {
      if (!stress) throw new Error(`CMUdict vowel requires stress: ${phone}`);
    } else if (consonants.has(symbol ?? "")) {
      if (stress) throw new Error(`CMUdict consonant cannot carry stress: ${phone}`);
    } else {
      throw new Error(`Unknown CMUdict phoneme: ${phone}`);
    }
  }
  return phones.join(" ");
}

export class CmuPronunciationProvider {
  readonly #dataset: z.infer<typeof datasetSchema>;

  constructor(dataset: unknown) {
    this.#dataset = datasetSchema.parse(dataset);
  }

  async lookup(request: {
    readonly word: string;
    readonly dialect: "en-US" | "en-GB";
  }): Promise<readonly PronunciationContent[]> {
    await Promise.resolve();
    if (request.dialect !== "en-US") return [];
    const word = normalizeWord(request.word);
    const variants = this.#dataset.entries[word];
    if (!variants) return [];

    return Object.freeze(
      variants.map((variant, index) =>
        pronunciationContentSchema.parse({
          word,
          dialect: "en-US",
          transcription: validateTranscription(variant),
          notation: "ARPABET",
          provenance: {
            ...this.#dataset.metadata,
            sourceId: `${word}#${String(index + 1)}`,
            generated: false,
            validationStatus: "verified",
          },
        }),
      ),
    );
  }
}
