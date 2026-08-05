import { spawn, spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { connect } from "node:net";
import { resolve } from "node:path";

const root = process.cwd();

function log(message) {
  console.log(`[dev:local] ${message}`);
}

function loadEnv(path) {
  if (!existsSync(path)) return;

  for (const line of readFileSync(path, "utf8").split(/\r?\n/u)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const separator = trimmed.indexOf("=");
    if (separator < 1) continue;

    const key = trimmed.slice(0, separator).trim();
    let value = trimmed.slice(separator + 1).trim();
    value = value.replace(/^["']|["']$/gu, "");
    process.env[key] ??= value;
  }
}

loadEnv(resolve(root, ".env.local"));
loadEnv(resolve(root, "apps/web/.env.local"));

const databaseUrl =
  process.env.DATABASE_URL ?? "postgres://postgres:postgres@localhost:5432/vocabulary";
const ollamaUrl = process.env.OLLAMA_BASE_URL ?? "http://localhost:11434";
const ollamaModel = process.env.OLLAMA_MODEL;
const localLearnerId = process.env.LOCAL_DEV_LEARNER_ID ?? "local-learner";

function commandExists(command) {
  const probe = process.platform === "win32" ? "where" : "which";
  return (
    spawnSync(probe, [command], {
      stdio: "ignore",
      shell: true,
    }).status === 0
  );
}

function portOpen(host, port, timeoutMs = 800) {
  return new Promise((resolvePort) => {
    const socket = connect({ host, port });
    const finish = (open) => {
      socket.destroy();
      resolvePort(open);
    };

    socket.setTimeout(timeoutMs);
    socket.once("connect", () => finish(true));
    socket.once("timeout", () => finish(false));
    socket.once("error", () => finish(false));
  });
}

async function waitForPort(host, port) {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    if (await portOpen(host, port)) return true;
    await new Promise((resolveWait) => setTimeout(resolveWait, 500));
  }
  return false;
}

function tryStartWindowsPostgresService() {
  if (process.platform !== "win32") return;

  const script = `
    $service = Get-Service |
      Where-Object { $_.Name -like 'postgresql*' } |
      Select-Object -First 1
    if ($null -eq $service) { exit 2 }
    if ($service.Status -ne 'Running') {
      Start-Service -Name $service.Name
    }
  `;

  spawnSync("powershell.exe", ["-NoProfile", "-Command", script], { stdio: "ignore" });
}

async function ensurePostgres() {
  const url = new URL(databaseUrl);
  const host = url.hostname || "localhost";
  const port = Number(url.port || "5432");

  if (!(await portOpen(host, port))) {
    log("Trying to start the Windows PostgreSQL service...");
    tryStartWindowsPostgresService();
  }

  if (!(await waitForPort(host, port))) {
    console.error("[dev:local] PostgreSQL is unavailable.");
    process.exit(1);
  }

  log(`PostgreSQL ready at ${host}:${port}`);
}

async function ollamaReady() {
  try {
    return (
      await fetch(`${ollamaUrl}/api/tags`, {
        signal: AbortSignal.timeout(1000),
      })
    ).ok;
  } catch {
    return false;
  }
}

async function ensureOllama() {
  if (!(await ollamaReady())) {
    if (!commandExists("ollama")) {
      console.error("[dev:local] Ollama is not installed.");
      process.exit(1);
    }

    const child = spawn("ollama", ["serve"], {
      detached: true,
      stdio: "ignore",
      shell: process.platform === "win32",
    });
    child.unref();

    for (let attempt = 0; attempt < 20; attempt += 1) {
      if (await ollamaReady()) break;
      await new Promise((resolveWait) => setTimeout(resolveWait, 500));
    }
  }

  if (!(await ollamaReady())) {
    console.error("[dev:local] Ollama is unavailable.");
    process.exit(1);
  }

  const response = await fetch(`${ollamaUrl}/api/tags`);
  const payload = await response.json();
  const models = Array.isArray(payload.models)
    ? payload.models.map((model) => model?.name).filter((name) => typeof name === "string")
    : [];

  if (!ollamaModel) {
    console.error(`[dev:local] OLLAMA_MODEL is missing. Installed: ${models.join(", ")}`);
    process.exit(1);
  }

  if (!models.includes(ollamaModel)) {
    console.error(
      `[dev:local] Model ${ollamaModel} is not installed. Installed: ${models.join(", ")}`,
    );
    process.exit(1);
  }

  log(`Ollama ready at ${ollamaUrl} using ${ollamaModel}`);
}

function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: root,
    env: {
      ...process.env,
      DATABASE_URL: databaseUrl,
      OLLAMA_BASE_URL: ollamaUrl,
      OLLAMA_MODEL: ollamaModel,
    },
    stdio: "inherit",
    shell: process.platform === "win32",
  });

  if (result.status !== 0) process.exit(result.status ?? 1);
}

await ensurePostgres();
await ensureOllama();

log("Building database runtime...");
run("pnpm", ["--filter", "@vocabulary/database", "build"]);

log("Applying database migrations...");
run("pnpm", ["--filter", "@vocabulary/database", "db:migrate"]);

log("Starting Vocabulary Web at http://localhost:3000");
log(`Local learner identity: ${localLearnerId}`);

const web = spawn("pnpm", ["--filter", "@vocabulary/web", "dev"], {
  cwd: root,
  env: {
    ...process.env,
    DATABASE_URL: databaseUrl,
    OLLAMA_BASE_URL: ollamaUrl,
    OLLAMA_MODEL: ollamaModel,
    LOCAL_DEV_AUTH: "true",
    LOCAL_DEV_LEARNER_ID: localLearnerId,
  },
  stdio: "inherit",
  shell: process.platform === "win32",
});

web.on("exit", (code) => process.exit(code ?? 0));
