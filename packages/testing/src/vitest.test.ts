import { describe, expect, it } from "vitest";
import { createVitestConfig } from "./vitest.js";

describe("createVitestConfig", () => {
  it("preserves safe defaults while accepting consumer overrides", () => {
    const config = createVitestConfig({ test: { environment: "node", testTimeout: 2_000 } });
    expect(config.test).toEqual(
      expect.objectContaining({
        clearMocks: true,
        environment: "node",
        restoreMocks: true,
        testTimeout: 2_000,
        unstubEnvs: true,
      }),
    );
  });
});
