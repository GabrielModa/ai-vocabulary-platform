import { z } from "zod";
import { provenanceSchema, type ContentProvenance } from "./content.js";

const metadataSchema = z
  .object({
    provider: z.literal("subtlex-us"),
    sourceVersion: z.string().trim().min(1).max(200),
    sourceUrl: z.url(),
    license: z.string().trim().min(1).max(2_000),
    attribution: z.string().trim().min(1).max(2_000),
    retrievedAt: z.iso.datetime({ offset: true }),
    corpusSize: z.number().int().positive(),
  })
  .strict();

const compactFrequencySchema = z
  .object({
    count: z.number().int().nonnegative(),
    frequencyPerMillion: z.number().nonnegative(),
    percentile: z.number().min(0).max(1),
  })
  .strict();

const datasetSchema = z
  .object({
    metadata: metadataSchema,
    entries: z.record(z.string(), z.unknown()),
  })
  .strict();

export const frequencyContentSchema = z
  .object({
    word: z.string().trim().min(1).max(200),
    normalizedWord: z.string().trim().min(1).max(200),
    count: z.number().int().nonnegative(),
    corpusSize: z.number().int().positive(),
    frequencyPerMillion: z.number().nonnegative(),
    percentile: z.number().min(0).max(1),
    provenance: provenanceSchema,
  })
  .strict();

export type FrequencyContent = z.infer<typeof frequencyContentSchema>;

export interface FrequencyProvider {
  lookup(request: { readonly word: string; readonly language: string }): Promise<unknown>;
}

function normalizeWord(value: string): string {
  return value.normalize("NFKC").toLocaleLowerCase("en-US").replace(/\s+/gu, " ").trim();
}

export class SubtlexFrequencyProvider implements FrequencyProvider {
  private readonly dataset: z.infer<typeof datasetSchema>;

  constructor(dataset: unknown) {
    this.dataset = datasetSchema.parse(dataset);
  }

  lookup(request: {
    readonly word: string;
    readonly language: string;
  }): Promise<FrequencyContent | undefined> {
    return Promise.resolve().then(() => {
      if (!/^en(?:-|$)/iu.test(request.language.trim())) return undefined;

      const normalizedWord = normalizeWord(request.word);
      if (!normalizedWord || !Object.hasOwn(this.dataset.entries, normalizedWord)) {
        return undefined;
      }

      const compact = compactFrequencySchema.parse(this.dataset.entries[normalizedWord]);
      const provenance: ContentProvenance = {
        provider: this.dataset.metadata.provider,
        sourceVersion: this.dataset.metadata.sourceVersion,
        sourceId: normalizedWord,
        sourceUrl: this.dataset.metadata.sourceUrl,
        license: this.dataset.metadata.license,
        attribution: this.dataset.metadata.attribution,
        retrievedAt: this.dataset.metadata.retrievedAt,
        generated: false,
        validationStatus: "verified",
      };

      return Object.freeze(
        frequencyContentSchema.parse({
          word: request.word.trim(),
          normalizedWord,
          count: compact.count,
          corpusSize: this.dataset.metadata.corpusSize,
          frequencyPerMillion: compact.frequencyPerMillion,
          percentile: compact.percentile,
          provenance,
        }),
      );
    });
  }
}
