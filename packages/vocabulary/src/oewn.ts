import { z } from "zod";
import { lexicalContentSchema, type LexicalContent, type LexicalProvider } from "./content.js";
import { partOfSpeechSchema } from "./model.js";

const metadataSchema = z
  .object({
    provider: z.literal("open-english-wordnet"),
    sourceVersion: z.string().trim().min(1).max(200),
    sourceUrl: z.url(),
    license: z.string().trim().min(1).max(2_000),
    attribution: z.string().trim().min(1).max(2_000),
    retrievedAt: z.iso.datetime({ offset: true }),
  })
  .strict();

const compactSenseSchema = z
  .object({
    senseId: z.string().trim().min(1).max(200),
    partOfSpeech: partOfSpeechSchema,
    definition: z.string().trim().min(1).max(2_000).optional(),
  })
  .strict();
const compactSenseListSchema = z.array(compactSenseSchema).max(100);
const datasetSchema = z
  .object({
    metadata: metadataSchema,
    entries: z.record(z.string(), z.unknown()),
  })
  .strict();

function normalizeWord(value: string): string {
  return value.normalize("NFKC").toLocaleLowerCase("en-US").replace(/\s+/gu, " ").trim();
}

export class OewnLexicalProvider implements LexicalProvider {
  private readonly dataset: z.infer<typeof datasetSchema>;

  constructor(dataset: unknown) {
    this.dataset = datasetSchema.parse(dataset);
  }

  lookup(request: {
    readonly word: string;
    readonly language: string;
  }): Promise<readonly LexicalContent[]> {
    return Promise.resolve().then(() => {
      if (!/^en(?:-|$)/iu.test(request.language.trim())) return [];
      const normalizedWord = normalizeWord(request.word);
      if (!normalizedWord || !Object.hasOwn(this.dataset.entries, normalizedWord)) return [];
      const compactSenses = compactSenseListSchema.parse(this.dataset.entries[normalizedWord]);
      const senses = compactSenses.map((sense) =>
        lexicalContentSchema.parse({
          word: normalizedWord,
          normalizedWord,
          ...sense,
          provenance: {
            ...this.dataset.metadata,
            sourceId: sense.senseId,
            generated: false,
            validationStatus: "verified",
          },
        }),
      );
      return Object.freeze(senses.map((sense) => Object.freeze(sense)));
    });
  }
}
