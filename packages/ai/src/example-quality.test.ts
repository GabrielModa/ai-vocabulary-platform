import { describe, expect, it } from "vitest";
import { assessGeneratedExample } from "./example-quality.js";

describe("generated example quality", () => {
  it("accepts a concise contextual A2 sentence", () => {
    expect(
      assessGeneratedExample({
        sentence: "The coach trains our team after school.",
        term: "coach",
        level: "A2",
      }),
    ).toEqual({
      status: "accepted",
      score: 100,
      wordCount: 7,
      contextWordCount: 6,
      targetOccurrences: 1,
      reasonCodes: [],
    });
  });

  it("rejects an A2 sentence that is too long for the requested level", () => {
    const result = assessGeneratedExample({
      sentence:
        "The experienced coach carefully reorganized the entire team because the difficult championship match required several complicated tactical changes.",
      term: "coach",
      level: "A2",
    });
    expect(result.status).toBe("rejected");
    expect(result.reasonCodes).toContain("level-length-exceeded");
  });

  it("rejects meta-definitions and repeated answers", () => {
    const result = assessGeneratedExample({
      sentence: "The word coach means coach in this lesson.",
      term: "coach",
      level: "B1",
    });
    expect(result.status).toBe("rejected");
    expect(result.reasonCodes).toEqual(
      expect.arrayContaining(["meta-definition", "target-repeated"]),
    );
  });

  it("allows a longer contextual sentence at C1", () => {
    expect(
      assessGeneratedExample({
        sentence:
          "Although the match was nearly over, the coach changed the formation to protect the narrow lead.",
        term: "coach",
        level: "C1",
      }).status,
    ).toBe("accepted");
  });
});
