import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import {
  findForbiddenDependencies,
  findSecrets,
  scanRepository,
  validateWorkflow,
} from "./ci-policy.mjs";

describe("CI policy", () => {
  it("parses the workflow and enforces permissions, timeouts, and pinned actions", async () => {
    const workflow = await readFile(".github/workflows/ci.yml", "utf8");
    expect(validateWorkflow(workflow)).toEqual([]);
  });

  it("rejects an intentionally forbidden dependency with an actionable finding", () => {
    expect(
      findForbiddenDependencies({ dependencies: { request: "1.0.0" } }, "fixture.json"),
    ).toEqual(["fixture.json: forbidden dependency request in dependencies"]);
  });

  it("detects secret fixtures without returning the secret value", () => {
    const secret = `AKIA${"A".repeat(16)}`;
    const findings = findSecrets(`credential=${secret}`, "src/example.ts");
    expect(findings).toEqual(["src/example.ts: potential secret detected"]);
    expect(JSON.stringify(findings)).not.toContain(secret);
  });

  it("runs the same repository scan used by CI", async () => {
    await expect(scanRepository()).resolves.toEqual([]);
  });
});
