import { z } from "zod";

export const vocabularyImageRequestSchema = z.object({
  term: z.string().trim().min(1).max(100),
  meaning: z.string().trim().min(1).max(500),
  context: z.string().trim().min(1).max(1_000),
  level: z.enum(["A2", "B1", "B2", "C1", "C2"]),
});

export const safeVocabularyImageSchema = z.object({
  mimeType: z.enum(["image/png", "image/jpeg", "image/webp"]),
  base64: z.string().min(100),
  safety: z.object({
    safe: z.literal(true),
    checkedBy: z.string().trim().min(1).max(100),
  }),
});

export type VocabularyImageRequest = z.infer<typeof vocabularyImageRequestSchema>;
export type SafeVocabularyImage = z.infer<typeof safeVocabularyImageSchema>;

export interface VocabularyImageProvider {
  generate(prompt: string): Promise<unknown>;
}

export class SafeVocabularyImageError extends Error {
  constructor(readonly code: "INVALID_REQUEST" | "UNSAFE_OR_INVALID_OUTPUT") {
    super(`Vocabulary image generation failed: ${code}`);
    this.name = "SafeVocabularyImageError";
  }
}

export function buildSafeVocabularyImagePrompt(input: VocabularyImageRequest): string {
  return [
    "Create a single uncluttered educational drawing, not a photograph, for an English vocabulary exercise.",
    `Target concept: ${input.term}.`,
    `Meaning: ${input.meaning}.`,
    `Scene context: ${input.context}.`,
    `Learner level: ${input.level}.`,
    "Use one central observable subject or action, a strong silhouette, minimal background detail, and a clear everyday composition that is easy to understand at a glance.",
    "For a relational or abstract concept, provide a supporting memory clue without pretending the image uniquely proves the answer.",
    "Use a clean colorful flat editorial illustration style; avoid photorealism, collages, decorative filler, unrelated people, or unrelated locations.",
    "Use no written words, letters, captions, logos, or brands, and do not show or spell the target word.",
    "Exclude celebrities, frightening imagery, weapons, injuries, sexual content, and age-inappropriate content.",
  ].join(" ");
}

export class SafeVocabularyImageGenerator {
  constructor(private readonly provider: VocabularyImageProvider) {}

  async generate(input: unknown): Promise<SafeVocabularyImage> {
    const request = vocabularyImageRequestSchema.safeParse(input);
    if (!request.success) throw new SafeVocabularyImageError("INVALID_REQUEST");
    const output = await this.provider.generate(buildSafeVocabularyImagePrompt(request.data));
    const safeImage = safeVocabularyImageSchema.safeParse(output);
    if (!safeImage.success) throw new SafeVocabularyImageError("UNSAFE_OR_INVALID_OUTPUT");
    return safeImage.data;
  }
}
