import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

describe("Windows launcher", () => {
  const source = readFileSync(
    fileURLToPath(new URL("../../../START-LEXI.ps1", import.meta.url)),
    "utf8",
  );

  it("delegates startup to the canonical complete local runtime", () => {
    expect(source).toContain("dev:local");
    expect(source).toContain('(Get-Command "pnpm.cmd").Source');
    expect(source).not.toContain('(Get-Command "corepack.cmd").Source');
    expect(source).not.toContain('python "-m image_worker.server"');
    expect(source).not.toContain("pnpm --filter @vocabulary/web dev");
  });

  it("keeps visual clues optional and waits before opening the browser", () => {
    expect(source).not.toContain("Venv do worker nao encontrada");
    expect(source).not.toContain("Modelo OpenVINO nao encontrado");
    expect(source.indexOf("Wait-Http $siteUrl")).toBeLessThan(
      source.indexOf("Start-Process $siteUrl"),
    );
  });

  it("owns and stops the delegated runtime", () => {
    expect(source).toContain("$runtime = Start-LocalProcess");
    expect(source).toContain("if ($Process -and $Process.HasExited) { return $false }");
    expect(source).toContain("Stop-Process -Id $runtime.Id");
  });
});
