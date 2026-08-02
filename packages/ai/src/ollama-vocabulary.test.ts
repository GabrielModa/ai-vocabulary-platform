import { describe, expect, it } from "vitest";
import { OllamaVocabularyError, OllamaVocabularyGenerator } from "./ollama-vocabulary.js";
const request = { topic: "football", requestedCount: 2, level: "B1" as const };
function response(content: unknown, ok = true) {
  return Promise.resolve(
    new Response(JSON.stringify({ message: { content: JSON.stringify(content) } }), {
      status: ok ? 200 : 503,
      headers: { "content-type": "application/json" },
    }),
  );
}
describe("Ollama vocabulary provider", () => {
  it("passes topic count and CEFR to Ollama and validates structured output", async () => {
    const calls: { input: string; init: RequestInit }[] = [];
    const generator = new OllamaVocabularyGenerator({
      fetch: (input, init) => {
        calls.push({ input, init });
        return response({
          title: "Football",
          candidates: [
            {
              term: "pitch",
              meaning: "playing surface",
              type: "noun",
              example: "The team entered the pitch.",
              challenge: "The team entered the ___.",
              contexts: ["The pitch is wet.", "They entered the pitch.", "The pitch is wide."],
            },
            {
              term: "pass",
              meaning: "send the ball",
              type: "verb",
              example: "Pass the ball to me.",
              challenge: "Please ___ the ball.",
              contexts: ["Pass the ball.", "She made a pass.", "The pass was accurate."],
            },
          ],
        });
      },
    });
    await expect(generator.generate(request)).resolves.toMatchObject({
      candidates: [{ term: "pitch" }, { term: "pass" }],
    });
    const body = calls[0]?.init.body;
    expect(typeof body === "string" ? body : "").toContain("exactly 2 unique B1");
    expect(typeof body === "string" ? body : "").toContain("practical everyday vocabulary");
  });
  it("rejects wrong counts and unavailable runtime safely", async () => {
    const wrong = new OllamaVocabularyGenerator({
      fetch: () => response({ title: "x", candidates: [] }),
    });
    await expect(wrong.generate(request)).rejects.toEqual(
      new OllamaVocabularyError("INVALID_OUTPUT"),
    );
    await expect(
      new OllamaVocabularyGenerator({ fetch: () => Promise.reject(new Error("private")) }).generate(
        request,
      ),
    ).rejects.toEqual(new OllamaVocabularyError("UNAVAILABLE"));
  });
});
