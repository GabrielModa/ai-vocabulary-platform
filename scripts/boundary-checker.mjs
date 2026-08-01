import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

const SOURCE_EXTENSION = /\.(?:c|m)?(?:j|t)sx?$/u;
const IMPORT_PATTERN =
  /(?:import|export)\s+(?:type\s+)?(?:[^"']*?\s+from\s+)?["']([^"']+)["']|(?:import|require)\s*\(\s*["']([^"']+)["']\s*\)/gu;

const normalize = (value) => value.split(path.sep).join("/");

async function collectFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries
      .filter(
        (entry) =>
          ![".git", ".next", ".turbo", "coverage", "dist", "node_modules"].includes(entry.name),
      )
      .map(async (entry) => {
        const target = path.join(directory, entry.name);
        return entry.isDirectory() ? collectFiles(target) : [target];
      }),
  );
  return files.flat();
}

function extractImports(source) {
  return [...source.matchAll(IMPORT_PATTERN)].map((match) => match[1] ?? match[2]);
}

function layerOf(file, layers) {
  return normalize(file)
    .split("/")
    .find((segment) => layers.includes(segment));
}

function resolveRelative(fromFile, specifier) {
  return normalize(path.resolve(path.dirname(fromFile), specifier));
}

function checkLayerImport(file, specifier, config) {
  const sourceLayer = layerOf(file, config.layers);
  if (!sourceLayer) return undefined;

  if (
    sourceLayer === "domain" &&
    config.domainForbiddenPackages.some((name) => specifier === name || specifier.startsWith(name))
  ) {
    return `domain cannot import provider or framework package "${specifier}"`;
  }

  if (!specifier.startsWith(".")) return undefined;
  const targetLayer = layerOf(resolveRelative(file, specifier), config.layers);
  const allowed = config.layerRules[sourceLayer] ?? [];
  return targetLayer && !allowed.includes(targetLayer)
    ? `${sourceLayer} cannot import ${targetLayer}`
    : undefined;
}

function contextInfo(file, contextRoot) {
  const marker = `${normalize(contextRoot).replace(/\/$/u, "")}/`;
  const normalized = normalize(file);
  const index = normalized.indexOf(marker);
  if (index < 0) return undefined;
  const afterRoot = normalized.slice(index + marker.length).split("/");
  return { context: afterRoot[0], relativeParts: afterRoot.slice(1) };
}

function checkContextImport(file, specifier, config, root) {
  if (!specifier.startsWith(".")) return undefined;
  const source = contextInfo(file, path.resolve(root, config.contextRoot));
  const target = contextInfo(
    resolveRelative(file, specifier),
    path.resolve(root, config.contextRoot),
  );
  if (!source || !target || source.context === target.context) return undefined;
  return config.contractDirectories.includes(target.relativeParts[0])
    ? undefined
    : `context "${source.context}" cannot import internals from context "${target.context}"`;
}

async function checkWorkspaceManifests(root, config) {
  const violations = [];
  for (const workspaceDirectory of ["packages", "apps"]) {
    const absolute = path.join(root, workspaceDirectory);
    let entries = [];
    try {
      entries = await readdir(absolute, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const entry of entries.filter((candidate) => candidate.isDirectory())) {
      const manifestPath = path.join(absolute, entry.name, "package.json");
      let manifest;
      try {
        manifest = JSON.parse(await readFile(manifestPath, "utf8"));
      } catch (error) {
        if (error?.code === "ENOENT") continue;
        violations.push({
          file: normalize(path.relative(root, manifestPath)),
          message: "invalid package.json",
        });
        continue;
      }
      const allowed = config.workspaceRules[manifest.name];
      if (!allowed) continue;
      const dependencies = {
        ...manifest.dependencies,
        ...manifest.devDependencies,
        ...manifest.peerDependencies,
      };
      for (const dependency of Object.keys(dependencies).filter((name) =>
        name.startsWith("@vocabulary/"),
      )) {
        if (!allowed.includes(dependency)) {
          violations.push({
            file: normalize(path.relative(root, manifestPath)),
            message: `${manifest.name} cannot depend on ${dependency}`,
          });
        }
      }
    }
  }
  return violations;
}

export async function checkBoundaries({
  root,
  configPath = "config/architecture-boundaries.json",
}) {
  const absoluteRoot = path.resolve(root);
  const config = JSON.parse(await readFile(path.resolve(absoluteRoot, configPath), "utf8"));
  const files = (await collectFiles(absoluteRoot)).filter((file) => SOURCE_EXTENSION.test(file));
  const violations = [];

  for (const file of files) {
    const source = await readFile(file, "utf8");
    for (const specifier of extractImports(source)) {
      const message =
        checkLayerImport(file, specifier, config) ??
        checkContextImport(file, specifier, config, absoluteRoot);
      if (message)
        violations.push({ file: normalize(path.relative(absoluteRoot, file)), message, specifier });
    }
  }
  violations.push(...(await checkWorkspaceManifests(absoluteRoot, config)));
  return violations.sort((left, right) =>
    `${left.file}:${left.message}`.localeCompare(`${right.file}:${right.message}`),
  );
}
