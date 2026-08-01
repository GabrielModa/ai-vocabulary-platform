#!/usr/bin/env node
import process from "node:process";
import { checkBoundaries } from "./boundary-checker.mjs";

const rootArgument = process.argv.indexOf("--root");
const root = rootArgument >= 0 ? process.argv[rootArgument + 1] : process.cwd();
const violations = await checkBoundaries({ root });

if (violations.length === 0) {
  console.log("Architecture boundaries passed.");
  process.exit(0);
}

console.error(`Architecture boundaries failed with ${violations.length} violation(s):`);
for (const violation of violations) {
  console.error(`- ${violation.file}: ${violation.message}`);
}
process.exit(1);
