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
          candidates: [
            { term: "pitch", type: "noun" },
            { term: "pass", type: "verb" },
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
    expect(typeof body === "string" ? body : "").toContain("dictionary headwords");
    const requestBody = JSON.parse(typeof body === "string" ? body : "{}") as Record<
      string,
      unknown
    >;
    expect(requestBody.format).toMatchObject({ type: "object", required: ["candidates"] });
    expect(requestBody.format).toMatchObject({
      properties: { candidates: { minItems: 2, maxItems: 2 } },
    });
    expect(requestBody.options).toMatchObject({ num_predict: 160 });
    expect(typeof body === "string" ? body : "").not.toContain("contexts");
  });

  it("returns honest pending fields and caches an identical request in memory", async () => {
    let calls = 0;
    const generator = new OllamaVocabularyGenerator({
      fetch: () => {
        calls += 1;
        return response({
          candidates: [
            { term: "pitch", type: "noun" },
            { term: "pass", type: "verb" },
          ],
        });
      },
    });

    const first = await generator.generate(request);
    const second = await generator.generate({ ...request });

    expect(calls).toBe(1);
    expect(second).toBe(first);
    expect(first.title).toBe("football vocabulary");
    expect(first.candidates[0]).toMatchObject({
      term: "pitch",
      meaning: "Meaning pending lexical verification.",
      example: "A verified example is not available yet.",
      challenge: "Confirm the intended meaning before training.",
    });
  });

  it("requests ten candidates in one bounded inference", async () => {
    let calls = 0;
    const generator = new OllamaVocabularyGenerator({
      fetch: (_input, init) => {
        calls += 1;
        if (typeof init.body !== "string") throw new Error("Expected a JSON request body");
        const body = JSON.parse(init.body) as {
          format: { properties: { candidates: { minItems: number; maxItems: number } } };
        };
        expect(body.format.properties.candidates).toMatchObject({ minItems: 10, maxItems: 10 });
        return response({
          candidates: Array.from({ length: 10 }, (_, index) => ({
            term: `term-${String(index + 1)}`,
            type: "noun",
          })),
        });
      },
    });

    const result = await generator.generate({ topic: "work", requestedCount: 10, level: "B1" });
    expect(result.candidates).toHaveLength(10);
    expect(calls).toBe(1);
  });

  it("excludes previously evaluated terms and isolates that request in the cache", async () => {
    const bodies: string[] = [];
    const generator = new OllamaVocabularyGenerator({
      fetch: (_input, init) => {
        const body = typeof init.body === "string" ? init.body : "";
        bodies.push(body);
        return response({
          candidates: [
            { term: "referee", type: "noun" },
            { term: "tackle", type: "verb" },
          ],
        });
      },
    });

    await generator.generate(request, { excludedTerms: ["pitch", "pass"] });
    await generator.generate(request, { excludedTerms: ["pitch", "pass"] });

    expect(bodies).toHaveLength(1);
    expect(bodies[0]).toContain("Avoid these existing terms: pass, pitch");
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
