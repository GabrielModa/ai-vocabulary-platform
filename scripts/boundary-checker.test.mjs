import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { checkBoundaries } from "./boundary-checker.mjs";

const roots = [];
const config = {
  contextRoot: "apps/api/src/contexts",
  contractDirectories: ["contracts"],
  layers: ["domain", "application", "adapters", "delivery"],
  layerRules: {
    domain: ["domain"],
    application: ["domain", "application"],
    adapters: ["domain", "application", "adapters"],
    delivery: ["domain", "application", "delivery"],
  },
  domainForbiddenPackages: ["openai", "drizzle-orm", "@nestjs/"],
  workspaceRules: { "@vocabulary/shared": [], "@vocabulary/config": ["@vocabulary/shared"] },
};

async function fixture(files) {
  const root = await mkdtemp(path.join(tmpdir(), "vocabulary-boundaries-"));
  roots.push(root);
  await mkdir(path.join(root, "config"), { recursive: true });
  await writeFile(path.join(root, "config/architecture-boundaries.json"), JSON.stringify(config));
  for (const [relative, content] of Object.entries(files)) {
    const target = path.join(root, relative);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, content);
  }
  return root;
}

afterEach(async () => {
  const { rm } = await import("node:fs/promises");
  await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

describe("architecture boundary checker", () => {
  it("allows dependencies pointing toward domain and public context contracts", async () => {
    const root = await fixture({
      "apps/api/src/contexts/learning/domain/model.ts": "export const mastery = 1;",
      "apps/api/src/contexts/learning/application/use-case.ts":
        "import { mastery } from '../domain/model'; export { mastery };",
      "apps/api/src/contexts/content/contracts/content.ts": "export const contentId = 'id';",
      "apps/api/src/contexts/learning/application/content.ts":
        "import { contentId } from '../../content/contracts/content'; export { contentId };",
    });
    expect(await checkBoundaries({ root })).toEqual([]);
  });

  it("rejects a domain dependency on a provider", async () => {
    const root = await fixture({
      "apps/api/src/contexts/learning/domain/model.ts":
        "import OpenAI from 'openai'; export { OpenAI };",
    });
    expect(await checkBoundaries({ root })).toEqual([
      expect.objectContaining({
        message: 'domain cannot import provider or framework package "openai"',
      }),
    ]);
  });

  it("rejects dependencies from domain toward adapters", async () => {
    const root = await fixture({
      "apps/api/src/contexts/learning/domain/model.ts":
        "import { repository } from '../adapters/repository'; export { repository };",
      "apps/api/src/contexts/learning/adapters/repository.ts": "export const repository = {};",
    });
    expect(await checkBoundaries({ root })).toEqual([
      expect.objectContaining({ message: "domain cannot import adapters" }),
    ]);
  });

  it("rejects imports from another context's internals", async () => {
    const root = await fixture({
      "apps/api/src/contexts/content/domain/model.ts": "export const internal = 1;",
      "apps/api/src/contexts/learning/application/content.ts":
        "import { internal } from '../../content/domain/model'; export { internal };",
    });
    expect(await checkBoundaries({ root })).toEqual([
      expect.objectContaining({
        message: 'context "learning" cannot import internals from context "content"',
      }),
    ]);
  });

  it("rejects a forbidden workspace dependency", async () => {
    const root = await fixture({
      "packages/shared/package.json": JSON.stringify({
        name: "@vocabulary/shared",
        dependencies: { "@vocabulary/config": "workspace:*" },
      }),
    });
    expect(await checkBoundaries({ root })).toEqual([
      expect.objectContaining({
        message: "@vocabulary/shared cannot depend on @vocabulary/config",
      }),
    ]);
  });
});
