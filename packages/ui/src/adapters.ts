import { designTokens } from "./tokens.js";

export function createWebTokenVariables(): Readonly<Record<string, string>> {
  return Object.freeze({
    "--ui-color-background": designTokens.color.background,
    "--ui-color-surface": designTokens.color.surface,
    "--ui-color-border": designTokens.color.border,
    "--ui-color-text": designTokens.color.text,
    "--ui-color-text-muted": designTokens.color.textMuted,
    "--ui-color-primary": designTokens.color.primary,
    "--ui-color-on-primary": designTokens.color.onPrimary,
    "--ui-color-focus": designTokens.color.focus,
    "--ui-color-success": designTokens.color.success,
    "--ui-color-warning": designTokens.color.warning,
    "--ui-color-error": designTokens.color.error,
    "--ui-target-min": `${String(designTokens.state.minTarget)}px`,
    "--ui-motion-fast": `${String(designTokens.motion.duration.fast)}ms`,
    "--ui-motion-reduced": `${String(designTokens.motion.reducedDuration)}ms`,
  });
}

export const nativeTokens = Object.freeze({
  color: designTokens.color,
  fontSize: designTokens.typography.size,
  fontWeight: designTokens.typography.weight,
  space: designTokens.space,
  radius: designTokens.radius,
  minTarget: designTokens.state.minTarget,
  motionDuration: designTokens.motion.duration,
  reducedMotionDuration: designTokens.motion.reducedDuration,
});
