#!/usr/bin/env node

import { readdir, readFile, mkdir, writeFile } from "node:fs/promises";
import { extname, join, resolve, dirname } from "node:path";

const inputDirectory = process.argv[2];
const outputPath = resolve(process.argv[3] ?? "data/oewn/examples.json");

if (!inputDirectory) {
  console.error(
    "Usage: node scripts/import-oewn-examples.mjs <extracted-oewn-json-directory> [output.json]",
  );
  process.exit(1);
}

const synsetIdPattern = /^oewn-\d{8}-[nvars]$/u;
const entries = {};

function normalizedExamples(value) {
  const candidates = Array.isArray(value?.examples)
    ? value.examples
    : Array.isArray(value?.example)
      ? value.example
      : [];

  return [
    ...new Set(
      candidates
        .filter((item) => typeof item === "string")
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  ];
}

function visit(value, keyHint) {
  if (!value || typeof value !== "object") return;

  const explicitId = typeof value.id === "string" ? value.id : undefined;
  const senseId =
    explicitId && synsetIdPattern.test(explicitId)
      ? explicitId
      : keyHint && synsetIdPattern.test(keyHint)
        ? keyHint
        : undefined;

  if (senseId) {
    const examples = normalizedExamples(value);
    if (examples.length > 0) entries[senseId] = examples;
  }

  if (Array.isArray(value)) {
    for (const item of value) visit(item, undefined);
    return;
  }

  for (const [key, child] of Object.entries(value)) visit(child, key);
}

async function collectJsonFiles(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await collectJsonFiles(path)));
    else if (entry.isFile() && extname(entry.name).toLowerCase() === ".json") files.push(path);
  }
  return files;
}

const files = await collectJsonFiles(resolve(inputDirectory));
for (const file of files) visit(JSON.parse(await readFile(file, "utf8")), undefined);

if (Object.keys(entries).length === 0) {
  throw new Error("No OEWN synset examples were found in the supplied JSON directory");
}

const dataset = {
  metadata: {
    provider: "open-english-wordnet",
    sourceVersion: "2025",
    sourceUrl: "https://en-word.net/downloads/english-wordnet-2025-json.zip",
    license: "CC-BY-4.0",
    attribution: "Open English WordNet contributors",
    retrievedAt: new Date().toISOString(),
  },
  entries: Object.fromEntries(
    Object.entries(entries).sort(([left], [right]) => left.localeCompare(right, "en-US")),
  ),
};

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(dataset)}\n`, "utf8");
console.log(`Imported examples for ${Object.keys(entries).length.toLocaleString("en-US")} synsets`);
console.log(`Output: ${outputPath}`);
