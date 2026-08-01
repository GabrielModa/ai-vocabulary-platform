import { readFile } from "node:fs/promises";
import {
  checkGeneratedContract,
  compatibilityBaselinePath,
  generateContract,
} from "./generator.js";
import { findBreakingChanges, lintOpenApi } from "./compatibility.js";
import { createOpenApiDocument } from "./spec.js";

async function main(): Promise<void> {
  const command = process.argv[2];
  if (command === "generate") return generateContract();
  if (command !== "check") throw new Error("Expected command: generate or check");

  const current = createOpenApiDocument();
  const baseline = JSON.parse(await readFile(compatibilityBaselinePath, "utf8")) as unknown;
  const failures = [
    ...lintOpenApi(current),
    ...findBreakingChanges(baseline as typeof current, current),
    ...(await checkGeneratedContract()).map((path) => `Generated file is stale: ${path}`),
  ];
  if (failures.length > 0) throw new Error(failures.join("\n"));
}

await main();
