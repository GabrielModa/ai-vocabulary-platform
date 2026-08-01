import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from "react";
import { designTokens, type SemanticState } from "../tokens.js";

export interface WebButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  readonly busy?: boolean;
  readonly state?: SemanticState;
}

export function Button({
  busy = false,
  children,
  disabled = false,
  state = "default",
  style,
  ...props
}: Readonly<WebButtonProps>) {
  const unavailable = disabled || busy;
  return (
    <button
      {...props}
      aria-busy={busy || undefined}
      data-state={busy ? "loading" : state}
      disabled={unavailable}
      style={{
        minHeight: designTokens.state.minTarget,
        minWidth: designTokens.state.minTarget,
        borderRadius: designTokens.radius.md,
        border: `1px solid ${designTokens.color.border}`,
        padding: `${String(designTokens.space.sm)}px ${String(designTokens.space.md)}px`,
        background: designTokens.color.primary,
        color: designTokens.color.onPrimary,
        font: "inherit",
        fontWeight: designTokens.typography.weight.medium,
        opacity: unavailable ? designTokens.state.disabledOpacity : 1,
        ...style,
      }}
    >
      {children}
    </button>
  );
}

export interface WebTextProps extends HTMLAttributes<HTMLParagraphElement> {
  readonly children: ReactNode;
  readonly tone?: "default" | "muted" | "success" | "warning" | "error";
}

export function Text({ children, style, tone = "default", ...props }: Readonly<WebTextProps>) {
  const colors = {
    default: designTokens.color.text,
    muted: designTokens.color.textMuted,
    success: designTokens.color.success,
    warning: designTokens.color.warning,
    error: designTokens.color.error,
  };
  return (
    <p
      {...props}
      style={{
        margin: 0,
        color: colors[tone],
        fontFamily: designTokens.typography.family.body,
        fontSize: "1rem",
        lineHeight: designTokens.typography.lineHeight.body,
        ...style,
      }}
    >
      {children}
    </p>
  );
}

export function Surface({ children, style, ...props }: Readonly<HTMLAttributes<HTMLElement>>) {
  return (
    <section
      {...props}
      style={{
        padding: designTokens.space.lg,
        border: `1px solid ${designTokens.color.border}`,
        borderRadius: designTokens.radius.lg,
        background: designTokens.color.surface,
        color: designTokens.color.text,
        ...style,
      }}
    >
      {children}
    </section>
  );
}
