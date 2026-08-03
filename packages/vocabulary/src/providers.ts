import { z } from "zod";
import { provenanceSchema } from "./content.js";
import { cefrLevelSchema } from "./model.js";

const identifier = z.string().trim().min(1).max(200);
const boundedText = z.string().trim().min(1).max(2_000);

export const pronunciationContentSchema = z
  .object({
    word: z.string().trim().min(1).max(200),
    dialect: z.enum(["en-US", "en-GB"]),
    transcription: z.string().trim().min(1).max(500).optional(),
    notation: z.enum(["IPA", "ARPABET"]).optional(),
    audioReference: identifier.optional(),
    provenance: provenanceSchema,
  })
  .strict()
  .superRefine((value, context) => {
    if (!value.transcription && !value.audioReference) {
      context.addIssue({
        code: "custom",
        message: "Pronunciation requires audio or a verified transcription",
      });
    }
    if (Boolean(value.transcription) !== Boolean(value.notation)) {
      context.addIssue({
        code: "custom",
        message: "Transcription and notation must be supplied together",
        path: [value.transcription ? "notation" : "transcription"],
      });
    }
  });

const originalExampleSchema = z
  .object({
    sentence: boundedText,
    provenance: provenanceSchema,
  })
  .strict();

export const exampleContentSchema = z
  .object({
    id: identifier,
    senseId: identifier,
    sentence: boundedText,
    original: originalExampleSchema.optional(),
    provenance: provenanceSchema,
  })
  .strict()
  .superRefine((value, context) => {
    if (value.provenance.adaptedFrom && !value.original) {
      context.addIssue({
        code: "custom",
        message: "Adapted examples must retain their original content",
        path: ["original"],
      });
    }
  });

export const imageContentSchema = z
  .object({
    senseId: identifier,
    imageReference: identifier,
    kind: z.enum(["licensed", "generated"]),
    provenance: provenanceSchema,
  })
  .strict()
  .superRefine((value, context) => {
    if ((value.kind === "generated") !== value.provenance.generated) {
      context.addIssue({
        code: "custom",
        message: "Image kind must agree with provenance",
        path: ["kind"],
      });
    }
  });

export const cefrClassificationSchema = z
  .object({
    senseId: identifier,
    level: cefrLevelSchema,
    rationaleCodes: z.array(identifier).max(20).default([]),
    provenance: provenanceSchema,
  })
  .strict();

function normalized(value: string): string {
  return value.normalize("NFKC").toLocaleLowerCase("en-US").replace(/\s+/gu, " ").trim();
}

export const exerciseContentSchema = z
  .object({
    id: identifier,
    senseId: identifier,
    gapSentence: boundedText,
    expectedAnswer: z.string().trim().min(1).max(200),
    distractors: z.array(z.string().trim().min(1).max(200)).length(3),
    explanation: boundedText.optional(),
    provenance: provenanceSchema,
  })
  .strict()
  .superRefine((value, context) => {
    const answers = [value.expectedAnswer, ...value.distractors].map(normalized);
    if (new Set(answers).size !== answers.length) {
      context.addIssue({ code: "custom", message: "Exercise answers must be unique" });
    }
    if ((value.gapSentence.match(/___/gu) ?? []).length !== 1) {
      context.addIssue({
        code: "custom",
        message: "Exercise sentence must contain exactly one gap",
        path: ["gapSentence"],
      });
    }
  });

export type PronunciationContent = z.infer<typeof pronunciationContentSchema>;
export type ExampleContent = z.infer<typeof exampleContentSchema>;
export type ImageContent = z.infer<typeof imageContentSchema>;
export type CefrClassification = z.infer<typeof cefrClassificationSchema>;
export type ExerciseContent = z.infer<typeof exerciseContentSchema>;

export interface PronunciationProvider {
  lookup(request: { readonly word: string; readonly dialect: "en-US" | "en-GB" }): Promise<unknown>;
}

export interface ExampleProvider {
  find(request: {
    readonly senseId: string;
    readonly level: z.infer<typeof cefrLevelSchema>;
  }): Promise<unknown>;
}

export interface ImageProvider {
  resolve(request: { readonly senseId: string; readonly context?: string }): Promise<unknown>;
}

export interface CefrClassifier {
  classify(request: { readonly senseId: string; readonly word: string }): Promise<unknown>;
}

export interface ExerciseGenerator {
  generate(request: {
    readonly senseId: string;
    readonly level: z.infer<typeof cefrLevelSchema>;
    readonly context?: string;
  }): Promise<unknown>;
}
