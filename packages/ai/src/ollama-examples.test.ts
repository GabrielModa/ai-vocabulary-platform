import { describe, expect, it } from "vitest";
import { OllamaExampleGenerator } from "./ollama-examples.js";
import type { OllamaFetch } from "./ollama-vocabulary.js";

const request = {
  topic: "football",
  level: "A2" as const,
  candidates: [
    {
      candidateId: "candidate-coach",
      term: "coach",
      partOfSpeech: "noun",
      senseId: "oewn-coach-n",
      definition: "someone in charge of training a team",
    },
    {
      candidateId: "candidate-penalty",
      term: "penalty",
      partOfSpeech: "noun",
      senseId: "oewn-penalty-n",
      definition: "a punishment for breaking a rule in a sport",
    },
  ],
};

function response(content: unknown): Response {
  return new Response(JSON.stringify({ message: { content: JSON.stringify(content) } }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}

describe("OllamaExampleGenerator", () => {
  it("generates the entire missing batch in one sense-bound request", async () => {
    let capturedInit: RequestInit | undefined;
    let calls = 0;
    const fetcher: OllamaFetch = (_input, init) => {
      calls += 1;
      capturedInit = init;
      return Promise.resolve(
        response({
          examples: [
            {
              candidateId: "candidate-coach",
              sentence: "The coach trains our team after school.",
            },
            {
              candidateId: "candidate-penalty",
              sentence: "The referee gave a penalty for the foul.",
            },
          ],
        }),
      );
    };
    const generator = new OllamaExampleGenerator({ fetch: fetcher });

    await expect(generator.generate(request)).resolves.toEqual([
      {
        candidateId: "candidate-coach",
        sentence: "The coach trains our team after school.",
      },
      {
        candidateId: "candidate-penalty",
        sentence: "The referee gave a penalty for the foul.",
      },
    ]);
    expect(calls).toBe(1);
    const serializedBody = capturedInit?.body;
    expect(typeof serializedBody).toBe("string");
    const body = JSON.parse(serializedBody as string) as {
      messages: { content: string }[];
    };
    expect(body.messages[1]?.content).toContain("oewn-penalty-n");
    expect(body.messages[1]?.content).toContain("a punishment for breaking a rule in a sport");
  });

  it("keeps valid items and retries only candidates with invalid sentences", async () => {
    const requestedCandidateIds: string[][] = [];
    let calls = 0;
    const generator = new OllamaExampleGenerator({
      fetch: (_input, init) => {
        const body = JSON.parse(init.body as string) as { messages: { content: string }[] };
        const prompt = JSON.parse(body.messages[1].content) as {
          candidates: { candidateId: string }[];
        };
        requestedCandidateIds.push(prompt.candidates.map(({ candidateId }) => candidateId));
        calls += 1;
        return Promise.resolve(
          response(
            calls === 1
              ? {
                  examples: [
                    {
                      candidateId: "candidate-coach",
                      sentence: "The coach trains our team after school.",
                    },
                    {
                      candidateId: "candidate-penalty",
                      sentence: "The referee punished the player today.",
                    },
                  ],
                }
              : {
                  examples: [
                    {
                      candidateId: "candidate-penalty",
                      sentence: "The referee gave a penalty for the foul.",
                    },
                  ],
                },
          ),
        );
      },
    });

    await expect(generator.generate(request)).resolves.toEqual([
      { candidateId: "candidate-coach", sentence: "The coach trains our team after school." },
      {
        candidateId: "candidate-penalty",
        sentence: "The referee gave a penalty for the foul.",
      },
    ]);
    expect(requestedCandidateIds).toEqual([
      ["candidate-coach", "candidate-penalty"],
      ["candidate-penalty"],
    ]);
  });

  it("returns the validated subset when retries are exhausted", async () => {
    let calls = 0;
    const generator = new OllamaExampleGenerator({
      maxAttempts: 2,
      fetch: () => {
        calls += 1;
        return Promise.resolve(
          response({
            examples: [
              {
                candidateId: "candidate-coach",
                sentence: "The coach trains our team after school.",
              },
            ],
          }),
        );
      },
    });

    await expect(generator.generate(request)).resolves.toEqual([
      { candidateId: "candidate-coach", sentence: "The coach trains our team after school." },
    ]);
    expect(calls).toBe(2);
  });

  it("fails honestly when no valid example is recovered", async () => {
    let calls = 0;
    const generator = new OllamaExampleGenerator({
      maxAttempts: 2,
      fetch: () => {
        calls += 1;
        return Promise.resolve(
          response({
            examples: [{ candidateId: "candidate-coach", sentence: "The manager trains us." }],
          }),
        );
      },
    });

    await expect(generator.generate(request)).rejects.toMatchObject({ code: "INVALID_OUTPUT" });
    expect(calls).toBe(2);
  });
});
