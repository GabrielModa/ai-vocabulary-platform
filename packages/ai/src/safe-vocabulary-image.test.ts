import { describe, expect, it } from "vitest";
import {
  SafeVocabularyImageError,
  SafeVocabularyImageGenerator,
  buildSafeVocabularyImagePrompt,
} from "./safe-vocabulary-image.js";

const request = {
  term: "goalkeeper",
  meaning: "the player who protects the goal",
  context: "The goalkeeper catches the ball.",
  level: "B1" as const,
};

describe("safe vocabulary image generation", () => {
  it("builds a controlled prompt without exposing a raw user image prompt", () => {
    expect(buildSafeVocabularyImagePrompt(request)).toContain("no written words");
    expect(buildSafeVocabularyImagePrompt(request)).toContain("Target concept: goalkeeper");
  });

  it("accepts only safety-checked image output", async () => {
    const valid = new SafeVocabularyImageGenerator({
      generate: () =>
        Promise.resolve({
          mimeType: "image/webp",
          base64: "a".repeat(100),
          safety: { safe: true, checkedBy: "local-image-safety" },
        }),
    });
    await expect(valid.generate(request)).resolves.toMatchObject({ mimeType: "image/webp" });

    const unchecked = new SafeVocabularyImageGenerator({
      generate: () => Promise.resolve({ mimeType: "image/webp", base64: "a".repeat(100) }),
    });
    await expect(unchecked.generate(request)).rejects.toEqual(
      new SafeVocabularyImageError("UNSAFE_OR_INVALID_OUTPUT"),
    );
  });
});
