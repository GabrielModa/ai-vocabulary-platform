import { describe, expect, it } from "vitest";
import { createWebTokenVariables, nativeTokens } from "./adapters.js";
import { contrastRatio, meetsWcagAa } from "./contrast.js";
import { designTokens, designTokensSchema } from "./tokens.js";

describe("design tokens", () => {
  it("satisfies the versioned schema and accessibility dimensions", () => {
    expect(designTokensSchema.parse(designTokens)).toEqual(designTokens);
    expect(designTokens.version).toBe("1.0.0");
    expect(designTokens.state.minTarget).toBeGreaterThanOrEqual(44);
    expect(designTokens.motion.reducedDuration).toBe(0);
  });

  it.each([
    ["text", designTokens.color.text, designTokens.color.background],
    ["muted text", designTokens.color.textMuted, designTokens.color.background],
    ["primary content", designTokens.color.onPrimary, designTokens.color.primary],
    ["success", designTokens.color.success, designTokens.color.background],
    ["warning", designTokens.color.warning, designTokens.color.background],
    ["error", designTokens.color.error, designTokens.color.background],
  ])("provides WCAG AA contrast for %s", (_name, foreground, background) => {
    expect(contrastRatio(foreground, background)).toBeGreaterThanOrEqual(4.5);
    expect(meetsWcagAa(foreground, background)).toBe(true);
  });

  it("maps equivalent semantics to web and native adapters", () => {
    const web = createWebTokenVariables();
    expect(web["--ui-color-primary"]).toBe(nativeTokens.color.primary);
    expect(web["--ui-target-min"]).toBe(`${String(nativeTokens.minTarget)}px`);
    expect(web["--ui-motion-reduced"]).toBe(`${String(nativeTokens.reducedMotionDuration)}ms`);
  });
});
