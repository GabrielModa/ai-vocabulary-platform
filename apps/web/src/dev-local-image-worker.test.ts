import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("local development image worker startup", () => {
  it("starts or reuses the image worker and forwards its URL", () => {
    const source = readFileSync(resolve(process.cwd(), "scripts/dev-local.mjs"), "utf8");

    expect(source).toContain("ensureImageWorker");
    expect(source).toContain("IMAGE_WORKER_URL");
    expect(source).toContain("image_worker.server");
    expect(source).toContain("/health");
    expect(source).toContain("stopOwnedChildren");
  });
});
