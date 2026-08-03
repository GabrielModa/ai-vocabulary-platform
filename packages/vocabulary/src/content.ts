import { z } from "zod";
import { cefrLevelSchema, partOfSpeechSchema } from "./model.js";

const identifier = z.string().trim().min(1).max(200);
const optionalSourceText = z.string().trim().min(1).max(2_000).optional();

export const validationStatusSchema = z.enum(["pending", "provisional", "verified", "rejected"]);

export const provenanceSchema = z
  .object({
    provider: identifier,
    sourceVersion: identifier.optional(),
    sourceId: identifier.optional(),
    sourceUrl: z.url().optional(),
    license: optionalSourceText,
    attribution: optionalSourceText,
    retrievedAt: z.iso.datetime({ offset: true }),
    generated: z.boolean(),
    adaptedFrom: identifier.optional(),
    validationStatus: validationStatusSchema,
  })
  .strict()
  .superRefine((value, context) => {
    if (value.generated && value.validationStatus === "verified") {
      context.addIssue({
        code: "custom",
        message: "Generated content cannot be treated as a verified fact",
        path: ["validationStatus"],
      });
    }
    if (
      value.validationStatus === "verified" &&
      (!value.sourceId || !value.license || !value.attribution)
    ) {
      context.addIssue({
        code: "custom",
        message: "Verified content requires source, license, and attribution",
        path: ["validationStatus"],
      });
    }
  });

function normalizeWord(value: string): string {
  return value.normalize("NFKC").toLocaleLowerCase("en-US").replace(/\s+/gu, " ").trim();
}

export const lexicalContentSchema = z
  .object({
    word: z.string().trim().min(1).max(200),
    normalizedWord: z.string().trim().min(1).max(200),
    senseId: identifier,
    partOfSpeech: partOfSpeechSchema,
    definition: z.string().trim().min(1).max(2_000).optional(),
    cefr: cefrLevelSchema.optional(),
    provenance: provenanceSchema,
  })
  .strict()
  .superRefine((value, context) => {
    if (value.normalizedWord !== normalizeWord(value.word)) {
      context.addIssue({
        code: "custom",
        message: "normalizedWord must be the canonical form of word",
        path: ["normalizedWord"],
      });
    }
  });

export type ValidationStatus = z.infer<typeof validationStatusSchema>;
export type ContentProvenance = z.infer<typeof provenanceSchema>;
export type LexicalContent = z.infer<typeof lexicalContentSchema>;

export interface LexicalLookupRequest {
  readonly word: string;
  readonly language: string;
}

export interface LexicalProvider {
  lookup(request: LexicalLookupRequest): Promise<unknown>;
}

export interface ContentValidator<T> {
  validate(content: unknown): Promise<T>;
}
