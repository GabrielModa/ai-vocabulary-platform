import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("pronunciation presentation", () => {
  const workspace = readFileSync(
    resolve(process.cwd(), "apps/web/app/capture-workspace.tsx"),
    "utf8",
  );

  it("uses a stable decorative SVG instead of encoded speaker emoji text", () => {
    expect(workspace).toContain("function SpeakerIcon()");
    expect(workspace).toContain('<svg aria-hidden="true"');
    expect(workspace).not.toMatch(/ð|Ã|â€|Ÿ/u);
  });

  it("labels verified CMUdict ARPABET separately from browser audio", () => {
    expect(workspace).toContain("Verified US pronunciation · ARPABET");
    expect(workspace).toContain("candidate.verifiedPronunciations");
    expect(workspace).not.toContain("official audio");
  });
});
