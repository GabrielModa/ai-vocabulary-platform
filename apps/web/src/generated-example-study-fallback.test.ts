import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("Study-mode generated example disclosure", () => {
  it("labels provisional generated examples separately from verified examples", () => {
    const source = readFileSync(
      resolve(process.cwd(), "apps/web/app/capture-workspace.tsx"),
      "utf8",
    );
    expect(source).toContain("candidate.exampleProvenance?.generated");
    expect(source).toContain('"AI-generated example"');
  });
});
