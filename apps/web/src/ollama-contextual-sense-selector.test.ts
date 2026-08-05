import { describe, expect, it, vi } from "vitest";
import { OllamaContextualSenseSelector } from "./ollama-contextual-sense-selector";

const request = {
  candidateId: "candidate:affection:noun",
  displayForm: "affection",
  normalizedLemma: "affection",
  proposedPartOfSpeech: "noun",
  context: {
    topic: "Love",
    learnerLevel: "B1",
    locale: "en-US",
  },
  allowedSenses: [
    {
      senseId: "sense-love",
      definition: "A feeling of fondness or care.",
      partOfSpeech: "noun",
    },
    {
      senseId: "sense-medical",
      definition: "A condition affecting the body.",
      partOfSpeech: "noun",
    },
  ],
};

describe("Ollama contextual sense selector", () => {
  it("sends only contextual input and allowed senses", async () => {
    const fetch = vi.fn().mockResolvedValue(
      Response.json({
        message: {
          content: JSON.stringify({
            selectedSenseId: "sense-love",
            confidence: 0.96,
            reasonCodes: ["topic-match"],
          }),
        },
      }),
    );
    const selector = new OllamaContextualSenseSelector({
      baseUrl: "http://ollama.test",
      model: "test-model",
      fetch,
    });

    await expect(selector.select(request)).resolves.toEqual({
      selectedSenseId: "sense-love",
      confidence: 0.96,
      reasonCodes: ["topic-match"],
    });

    expect(fetch).toHaveBeenCalledOnce();
    const [url, init] = fetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("http://ollama.test/api/chat");

    if (typeof init.body !== "string") {
      throw new Error("expected JSON request body");
    }

    const body = JSON.parse(init.body) as {
      readonly model: string;
      readonly options: { readonly temperature: number };
      readonly messages: readonly {
        readonly content: string;
      }[];
    };
    expect(body.model).toBe("test-model");
    expect(body.options.temperature).toBe(0);
    expect(JSON.parse(body.messages[1]?.content ?? "{}")).toEqual({
      topic: "Love",
      learnerLevel: "B1",
      locale: "en-US",
      candidate: {
        candidateId: "candidate:affection:noun",
        displayForm: "affection",
        normalizedLemma: "affection",
        proposedPartOfSpeech: "noun",
      },
      allowedSenses: request.allowedSenses,
    });
  });

  it("rejects unavailable and malformed responses", async () => {
    const unavailable = new OllamaContextualSenseSelector({
      fetch: () => Promise.resolve(new Response(null, { status: 503 })),
    });
    await expect(unavailable.select(request)).rejects.toThrow("unavailable");

    const malformed = new OllamaContextualSenseSelector({
      fetch: () =>
        Promise.resolve(
          Response.json({
            message: { content: "not-json" },
          }),
        ),
    });
    await expect(malformed.select(request)).rejects.toThrow();
  });
});
