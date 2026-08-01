import { defineConfig, mergeConfig, type ViteUserConfig } from "vitest/config";

export const baseVitestConfig: ViteUserConfig = defineConfig({
  test: {
    clearMocks: true,
    passWithNoTests: true,
    restoreMocks: true,
    unstubEnvs: true,
    unstubGlobals: true,
  },
});

export function createVitestConfig(overrides: ViteUserConfig = {}): ViteUserConfig {
  return mergeConfig(baseVitestConfig, defineConfig(overrides));
}
