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
    "Create one friendly educational illustration for an English vocabulary exercise.",
    `Target concept: ${input.term}.`,
    `Meaning: ${input.meaning}.`,
    `Scene context: ${input.context}.`,
    `Learner level: ${input.level}.`,
    "Show a clear everyday scene with no written words, letters, captions, logos, brands, celebrities, frightening imagery, weapons, injuries, sexual content, or age-inappropriate content.",
    "Use a clean colorful editorial illustration style and make the target concept visually central.",
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
