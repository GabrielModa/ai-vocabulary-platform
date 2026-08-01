import { readFile } from "node:fs/promises";
import { relative, resolve } from "node:path";
import process from "node:process";
import { parse } from "yaml";

const forbiddenDependencies = new Set(["request", "node-fetch", "moment", "lodash"]);
const secretPatterns = [
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/u,
  /AKIA[0-9A-Z]{16}/u,
  /(?:api[_-]?key|secret|token)\s*[:=]\s*["'](?:sk-|sk_|rk_|phc_)[A-Za-z0-9_+/=-]{20,}["']/iu,
];

export function findForbiddenDependencies(manifest, fileName = "package.json") {
  const findings = [];
  for (const section of ["dependencies", "devDependencies", "optionalDependencies"]) {
    const dependencies = manifest[section];
    if (!dependencies || typeof dependencies !== "object") continue;
    for (const dependency of Object.keys(dependencies)) {
      if (forbiddenDependencies.has(dependency)) {
        findings.push(`${fileName}: forbidden dependency ${dependency} in ${section}`);
      }
    }
  }
  return findings;
}

export function findSecrets(content, fileName) {
  if (fileName.includes("fixtures/negative/")) return [];
  return secretPatterns.flatMap((pattern) =>
    pattern.test(content) ? [`${fileName}: potential secret detected`] : [],
  );
}

export function validateWorkflow(content) {
  const document = parse(content);
  const findings = [];
  if (!document || typeof document !== "object") return ["Workflow must be a YAML object"];
  if (document.permissions?.contents !== "read")
    findings.push("Top-level contents permission must be read");
  if (!document.concurrency) findings.push("Workflow concurrency is required");
  for (const [jobName, job] of Object.entries(document.jobs ?? {})) {
    if (!job || typeof job !== "object") continue;
    if (!Number.isInteger(job["timeout-minutes"]))
      findings.push(`${jobName}: timeout-minutes is required`);
    for (const step of job.steps ?? []) {
      if (typeof step?.uses === "string" && !/@[0-9a-f]{40}$/u.test(step.uses)) {
        findings.push(`${jobName}: action must be pinned to a full commit SHA: ${step.uses}`);
      }
    }
  }
  return findings;
}

async function trackedFiles() {
  const { execFile } = await import("node:child_process");
  const { promisify } = await import("node:util");
  const execute = promisify(execFile);
  const { stdout } = await execute("git", ["ls-files", "-co", "--exclude-standard"], {
    encoding: "utf8",
  });
  return stdout.trim().split("\n").filter(Boolean);
}

export async function scanRepository(root = process.cwd()) {
  const findings = [];
  for (const file of await trackedFiles()) {
    if (/^(?:node_modules|dist|coverage|\.next)\//u.test(file)) continue;
    const path = resolve(root, file);
    let content;
    try {
      content = await readFile(path, "utf8");
    } catch {
      continue;
    }
    findings.push(...findSecrets(content, file));
    if (file.endsWith("package.json")) {
      findings.push(...findForbiddenDependencies(JSON.parse(content), relative(root, path)));
    }
  }
  const workflowPath = resolve(root, ".github/workflows/ci.yml");
  findings.push(...validateWorkflow(await readFile(workflowPath, "utf8")));
  return findings;
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(import.meta.filename)) {
  const findings = await scanRepository();
  if (findings.length > 0) {
    console.error(findings.join("\n"));
    process.exitCode = 1;
  } else console.log("CI policy and repository security checks passed.");
}
