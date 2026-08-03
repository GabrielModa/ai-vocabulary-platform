import { z } from "zod";
import { exampleContentSchema, type ExampleContent, type ExampleProvider } from "./providers.js";

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

const exampleListSchema = z.array(z.string().trim().min(1).max(2_000)).max(50);
const datasetSchema = z
  .object({
    metadata: metadataSchema,
    entries: z.record(z.string(), z.unknown()),
  })
  .strict();

export class OewnExampleProvider implements ExampleProvider {
  private readonly dataset: z.infer<typeof datasetSchema>;

  constructor(dataset: unknown) {
    this.dataset = datasetSchema.parse(dataset);
  }

  find(request: { readonly senseId: string }): Promise<readonly ExampleContent[]> {
    return Promise.resolve().then(() => {
      const senseId = request.senseId.trim();
      if (!senseId || !Object.hasOwn(this.dataset.entries, senseId)) return [];

      const sentences = exampleListSchema.parse(this.dataset.entries[senseId]);
      const examples = sentences.map((sentence, index) => {
        const exampleNumber = String(index + 1);
        return exampleContentSchema.parse({
          id: `${senseId}:example:${exampleNumber}`,
          senseId,
          sentence,
          provenance: {
            ...this.dataset.metadata,
            sourceId: `${senseId}:example:${exampleNumber}`,
            generated: false,
            validationStatus: "verified",
          },
        });
      });

      return Object.freeze(examples.map((example) => Object.freeze(example)));
    });
  }
}
