import { describe, expect, it, vi } from "vitest";
import { OllamaPhotoCandidateExtractor, OllamaPhotoError } from "./ollama-photo.js";

describe("local Ollama photo candidate extraction", () => {
  it("returns normalized unique visible terms without accepting lexical facts", async () => {
    let requestBody: BodyInit | null | undefined;
    const fetch = vi.fn((_input: string | URL | Request, init?: RequestInit) => {
      requestBody = init?.body;
      return Promise.resolve(
        new Response(
          JSON.stringify({
            message: { content: JSON.stringify({ terms: [" Book ", "lamp", "book"] }) },
          }),
          { status: 200 },
        ),
      );
    });
    const extractor = new OllamaPhotoCandidateExtractor({ fetch });

    await expect(
      extractor.extract({ bytes: new Uint8Array([1, 2, 3]), mimeType: "image/jpeg", level: "A2" }),
    ).resolves.toEqual({ terms: ["book", "lamp"] });

    if (typeof requestBody !== "string") throw new Error("missing JSON request body");
    const request = JSON.parse(requestBody) as {
      model: string;
      messages: readonly { images?: readonly string[]; content: string }[];
    };
    expect(request.model).toBe("qwen2.5vl:3b");
    expect(request.messages[1]?.images?.[0]).toBe("AQID");
    expect(request.messages[0]?.content).toContain("Never infer identity");
  });

  it("fails closed for unavailable or malformed model output", async () => {
    const unavailable = new OllamaPhotoCandidateExtractor({
      fetch: () => Promise.reject(new Error("connection details")),
    });
    await expect(
      unavailable.extract({ bytes: new Uint8Array([1]), mimeType: "image/png", level: "B1" }),
    ).rejects.toEqual(new OllamaPhotoError("UNAVAILABLE"));

    const malformed = new OllamaPhotoCandidateExtractor({
      fetch: () =>
        Promise.resolve(
          new Response(JSON.stringify({ message: { content: '{"terms":[]}' } }), { status: 200 }),
        ),
    });
    await expect(
      malformed.extract({ bytes: new Uint8Array([1]), mimeType: "image/png", level: "B1" }),
    ).rejects.toEqual(new OllamaPhotoError("INVALID_OUTPUT"));
  });
});
