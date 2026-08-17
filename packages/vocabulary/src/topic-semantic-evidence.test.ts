import { describe, expect, it } from "vitest";
import { semanticEvidenceForTopic } from "./topic-semantic-evidence.js";

describe("topic semantic evidence", () => {
  it.each([
    ["Football vocabulary", "football", "spatial"],
    ["finance", "money", "financial"],
    ["tourism", "travel", "destination"],
    ["cooking", "kitchen", "ingredient"],
    ["workplace", "work", "responsibility"],
    ["healthcare", "health", "treatment"],
    ["tech", "technology", "software"],
    ["climate", "environment", "pollution"],
    ["housing", "home", "furniture"],
    ["retail", "shopping", "purchase"],
    ["relatives", "family", "sibling"],
    ["education", "education", "curriculum"],
  ])("resolves %s to the reviewed %s profile", (topic, profile, concept) => {
    const evidence = semanticEvidenceForTopic(topic);

    expect(evidence.profile).toBe(profile);
    expect(evidence.weightFor(concept)).toBeGreaterThan(0);
  });

  it("keeps unknown topics literal and conservative", () => {
    const evidence = semanticEvidenceForTopic("quantum chromodynamics");

    expect(evidence.profile).toBeUndefined();
    expect(evidence.tokenCount).toBe(2);
    expect(evidence.weightFor("quantum")).toBe(4);
    expect(evidence.weightFor("chromodynamics")).toBe(4);
    expect(evidence.weightFor("physics")).toBe(0);
  });
});
