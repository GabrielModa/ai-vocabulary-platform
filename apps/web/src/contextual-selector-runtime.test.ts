import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("contextual selector runtime", () => {
  it("connects local AI selection before generated example enrichment", () => {
    const route = readFileSync(
      resolve(process.cwd(), "apps/web/app/api/vocabulary/generate/route.ts"),
      "utf8",
    );
    expect(route).toContain("OllamaContextualSenseSelector");
    expect(route).toContain("resolveVocabularySetContextually");
    expect(
      route.indexOf("const contextuallyResolved = await resolveVocabularySetContextually"),
    ).toBeLessThan(route.indexOf("return enrichMissingStudyExamples"));
  });
});
