#!/usr/bin/env node

import { createReadStream } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { createInterface } from "node:readline";
import { dirname, resolve } from "node:path";

const inputPath = process.argv[2];
const outputPath = resolve(process.argv[3] ?? "data/subtlex/index.json");

if (!inputPath) {
  console.error(
    "Usage: node scripts/import-subtlex-frequency.mjs <source.tsv|source.csv> [output.json]",
  );
  process.exit(1);
}

function normalizeWord(value) {
  return value.normalize("NFKC").toLocaleLowerCase("en-US").replace(/\s+/gu, " ").trim();
}

function splitLine(line, delimiter) {
  return line.split(delimiter).map((value) => value.trim().replace(/^"|"$/gu, ""));
}

function resolveColumn(headers, candidates) {
  const normalized = headers.map((header) => header.toLocaleLowerCase("en-US"));
  for (const candidate of candidates) {
    const index = normalized.indexOf(candidate);
    if (index >= 0) return index;
  }
  return -1;
}

const stream = createReadStream(resolve(inputPath), { encoding: "utf8" });
const lines = createInterface({ input: stream, crlfDelay: Infinity });

let headers;
let delimiter = "\t";
let wordColumn = -1;
let countColumn = -1;
const counts = new Map();

for await (const rawLine of lines) {
  const line = rawLine.replace(/^\uFEFF/u, "").trim();
  if (!line) continue;

  if (!headers) {
    delimiter = line.includes("\t") ? "\t" : ",";
    headers = splitLine(line, delimiter);
    wordColumn = resolveColumn(headers, ["word", "spelling", "wordform"]);
    countColumn = resolveColumn(headers, ["count", "freqcount", "frequency", "freq"]);

    if (wordColumn < 0 || countColumn < 0) {
      throw new Error(`Could not find word/count columns. Headers: ${headers.join(", ")}`);
    }
    continue;
  }

  const columns = splitLine(line, delimiter);
  const word = normalizeWord(columns[wordColumn] ?? "");
  const count = Number(columns[countColumn]);

  if (!word || !Number.isFinite(count) || count < 0 || !Number.isInteger(count)) continue;
  counts.set(word, (counts.get(word) ?? 0) + count);
}

if (counts.size === 0) {
  throw new Error("No valid SUBTLEX frequency records were imported");
}

const corpusSize = [...counts.values()].reduce((total, count) => total + count, 0);
const ranked = [...counts.entries()].sort(
  ([leftWord, leftCount], [rightWord, rightCount]) =>
    rightCount - leftCount || leftWord.localeCompare(rightWord, "en-US"),
);
const denominator = Math.max(1, ranked.length - 1);
const entries = {};

ranked.forEach(([word, count], index) => {
  entries[word] = {
    count,
    frequencyPerMillion: Number(((count / corpusSize) * 1_000_000).toFixed(6)),
    percentile: Number((1 - index / denominator).toFixed(6)),
  };
});

const dataset = {
  metadata: {
    provider: "subtlex-us",
    sourceVersion: "SUBTLEX-US",
    sourceUrl: "https://github.com/words/subtlex-word-frequencies",
    license: "ISC",
    attribution: "SUBTLEX-US authors and subtlex-word-frequencies contributors",
    retrievedAt: new Date().toISOString(),
    corpusSize,
  },
  entries,
};

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(dataset)}\n`, "utf8");

console.log(`Imported ${ranked.length.toLocaleString("en-US")} words`);
console.log(`Corpus tokens: ${corpusSize.toLocaleString("en-US")}`);
console.log(`Output: ${outputPath}`);
