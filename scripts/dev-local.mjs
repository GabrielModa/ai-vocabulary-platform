import { spawn, spawnSync } from "node:child_process";
import { connect } from "node:net";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const defaultDatabaseUrl = "postgres://postgres:postgres@localhost:5432/vocabulary";
const databaseUrl = process.env.DATABASE_URL ?? defaultDatabaseUrl;
const ollamaUrl = process.env.OLLAMA_BASE_URL ?? "http://localhost:11434";

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

async function waitForPort(host, port, attempts = 20) {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    if (await portOpen(host, port)) return true;
    await new Promise((resolveWait) => setTimeout(resolveWait, 500));
  }
  return false;
}

function tryStartWindowsPostgresService() {
  if (process.platform !== "win32") return false;

  const script = `
    $service = Get-Service |
      Where-Object { $_.Name -like 'postgresql*' } |
      Select-Object -First 1
    if ($null -eq $service) { exit 2 }
    if ($service.Status -ne 'Running') {
      Start-Service -Name $service.Name
    }
    Write-Output $service.Name
  `;

  const result = spawnSync("powershell.exe", ["-NoProfile", "-Command", script], {
    encoding: "utf8",
  });

  if (result.status === 0) {
    log(`PostgreSQL service started: ${result.stdout.trim()}`);
    return true;
  }

  return false;
}

async function ensurePostgres() {
  const url = new URL(databaseUrl);
  const host = url.hostname || "localhost";
  const port = Number(url.port || "5432");

  if (await portOpen(host, port)) {
    log(`PostgreSQL ready at ${host}:${port}`);
    return;
  }

  log("PostgreSQL is not responding. Trying the Windows service...");
  tryStartWindowsPostgresService();

  if (await waitForPort(host, port)) {
    log(`PostgreSQL ready at ${host}:${port}`);
    return;
  }

  console.error(`
[dev:local] PostgreSQL is not installed or not running.

Docker is not required, but PostgreSQL must be installed once.
Install PostgreSQL 16 for Windows, create:

  user: postgres
  password: postgres
  database: vocabulary
  port: 5432

Then run this same command again:

  pnpm dev:local
`);
  process.exit(1);
}

async function ollamaReady() {
  try {
    const response = await fetch(`${ollamaUrl}/api/tags`, {
      signal: AbortSignal.timeout(1000),
    });
    return response.ok;
  } catch {
    return false;
  }
}

async function ensureOllama() {
  if (await ollamaReady()) {
    log(`Ollama ready at ${ollamaUrl}`);
    return;
  }

  if (!commandExists("ollama")) {
    console.error(`
[dev:local] Ollama is not installed.

Install Ollama once, download a model, and rerun:

  ollama pull llama3.2
  pnpm dev:local
`);
    process.exit(1);
  }

  log("Starting Ollama...");
  const child = spawn("ollama", ["serve"], {
    detached: true,
    stdio: "ignore",
    shell: process.platform === "win32",
  });
  child.unref();

  for (let attempt = 0; attempt < 20; attempt += 1) {
    if (await ollamaReady()) {
      log(`Ollama ready at ${ollamaUrl}`);
      return;
    }
    await new Promise((resolveWait) => setTimeout(resolveWait, 500));
  }

  console.error("[dev:local] Ollama did not become ready.");
  process.exit(1);
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: root,
    env: {
      ...process.env,
      DATABASE_URL: databaseUrl,
      OLLAMA_BASE_URL: ollamaUrl,
    },
    stdio: "inherit",
    shell: process.platform === "win32",
    ...options,
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

await ensurePostgres();
await ensureOllama();

log("Building database runtime...");
run("pnpm", ["--filter", "@vocabulary/database", "build"]);

log("Applying database migrations...");
run("pnpm", ["--filter", "@vocabulary/database", "db:migrate"]);

log("Starting Vocabulary Web at http://localhost:3000");
const web = spawn("pnpm", ["--filter", "@vocabulary/web", "dev"], {
  cwd: root,
  env: {
    ...process.env,
    DATABASE_URL: databaseUrl,
    OLLAMA_BASE_URL: ollamaUrl,
    OLLAMA_MODEL: process.env.OLLAMA_MODEL,
  },
  stdio: "inherit",
  shell: process.platform === "win32",
});

web.on("exit", (code) => {
  process.exit(code ?? 0);
});
