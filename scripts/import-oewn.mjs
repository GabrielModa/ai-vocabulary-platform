import { readFile, readdir, mkdir, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";

const RELEASE = "2025";
const RELEASE_URL = "https://en-word.net/static/english-wordnet-2025-json.zip";
const LICENSE = "CC-BY-4.0";
const ATTRIBUTION = "Open English WordNet contributors";
const POSITIONS = new Map([
  ["n", "noun"],
  ["v", "verb"],
  ["a", "adjective"],
  ["s", "adjective"],
  ["r", "adverb"],
]);

function option(name) {
  const index = process.argv.indexOf(name);
  return index === -1 ? undefined : process.argv[index + 1];
}

function normalizeWord(value) {
  return value.normalize("NFKC").toLocaleLowerCase("en-US").replace(/\s+/gu, " ").trim();
}

async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

const sourceArgument = option("--source");
const outputArgument = option("--output");
if (!sourceArgument || !outputArgument) {
  throw new Error(
    "Usage: node scripts/import-oewn.mjs --source <extracted-json-dir> --output <index.json>",
  );
}

const source = resolve(sourceArgument);
const output = resolve(outputArgument);
const filenames = await readdir(source);
const entryFiles = filenames.filter((name) => /^entries-.+\.json$/u.test(name)).sort();
const synsetFiles = filenames
  .filter((name) => name.endsWith(".json") && !name.startsWith("entries-"))
  .sort();
if (entryFiles.length === 0 || synsetFiles.length === 0) {
  throw new Error("The source directory does not contain an extracted OEWN JSON release");
}

const synsets = new Map();
for (const filename of synsetFiles) {
  const contents = await readJson(join(source, filename));
  for (const [id, synset] of Object.entries(contents)) synsets.set(id, synset);
}

const retrievedAt = new Date().toISOString();
const lexicalIndex = Object.create(null);
for (const filename of entryFiles) {
  const entries = await readJson(join(source, filename));
  for (const [word, positions] of Object.entries(entries)) {
    if (!positions || typeof positions !== "object" || Array.isArray(positions)) continue;
    const normalizedWord = normalizeWord(word);
    const records = [];
    for (const [positionCode, entry] of Object.entries(positions)) {
      const partOfSpeech = POSITIONS.get(positionCode);
      if (!partOfSpeech || !entry || typeof entry !== "object" || !Array.isArray(entry.sense))
        continue;
      for (const sense of entry.sense) {
        const synset = synsets.get(sense.synset);
        if (!synset) continue;
        const definition = Array.isArray(synset.definition)
          ? synset.definition.find((value) => typeof value === "string" && value.trim())
          : undefined;
        records.push({
          senseId: `oewn-${sense.synset}`,
          partOfSpeech,
          ...(definition ? { definition } : {}),
        });
      }
    }
    if (records.length > 0) {
      const existing = lexicalIndex[normalizedWord] ?? [];
      const bySense = new Map([...existing, ...records].map((record) => [record.senseId, record]));
      lexicalIndex[normalizedWord] = [...bySense.values()];
    }
  }
}

await mkdir(dirname(output), { recursive: true });
const dataset = {
  metadata: {
    provider: "open-english-wordnet",
    sourceVersion: RELEASE,
    sourceUrl: RELEASE_URL,
    license: LICENSE,
    attribution: ATTRIBUTION,
    retrievedAt,
  },
  entries: lexicalIndex,
};
await writeFile(output, `${JSON.stringify(dataset)}\n`, "utf8");
console.log(`Imported ${Object.keys(lexicalIndex).length} OEWN lemmas into ${output}`);
