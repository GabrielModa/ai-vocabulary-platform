import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("image quality and study polish", () => {
  it("sends both the verified meaning and example scene to image generation", () => {
    const source = readFileSync(
      resolve(process.cwd(), "apps/web/app/capture-workspace.tsx"),
      "utf8",
    );

    expect(source).toContain(
      "const context = `${candidate.meaning}. Example scene: ${candidate.example}`",
    );
    expect(source).toContain("for (let attempt = 0; attempt < 2; attempt += 1)");
  });

  it("does not expose the internal study session identifier", () => {
    const source = readFileSync(
      resolve(process.cwd(), "apps/web/app/capture-workspace.tsx"),
      "utf8",
    );

    expect(source).not.toContain("Study session {studySessionId}");
    expect(source).toContain("Your study session is ready.");
  });

  it("contains responsive visual-clue and navigation constraints", () => {
    const styles = readFileSync(resolve(process.cwd(), "apps/web/app/styles.css"), "utf8");

    expect(styles).toContain("/* Task 095:");
    expect(styles).toContain(".practice-image.ready");
    expect(styles).toContain("overflow-wrap: anywhere");
    expect(styles).toContain("@media (max-width: 760px)");
  });
});
