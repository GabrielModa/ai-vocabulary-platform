// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import type { CSSProperties, ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

vi.mock("react-native", () => ({
  Pressable: ({
    accessibilityLabel,
    accessibilityState,
    children,
    style,
  }: {
    accessibilityLabel: string;
    accessibilityState: { busy: boolean; disabled: boolean };
    children: ReactNode;
    style: (state: { pressed: boolean }) => CSSProperties;
  }) => (
    <button
      aria-busy={accessibilityState.busy}
      aria-label={accessibilityLabel}
      disabled={accessibilityState.disabled}
      style={style({ pressed: false })}
    >
      {children}
    </button>
  ),
  Text: ({ allowFontScaling, children }: { allowFontScaling: boolean; children: ReactNode }) => (
    <span data-allow-font-scaling={String(allowFontScaling)}>{children}</span>
  ),
  View: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

describe("native primitives", () => {
  it("renders a scalable, labeled, touch-sized button contract", async () => {
    const { Button } = await import("./primitives.js");
    render(<Button accessibilityLabel="Start practice">Start</Button>);

    const button = screen.getByRole("button", { name: "Start practice" });
    expect(button).toHaveStyle({ minHeight: "44px", minWidth: "44px" });
    expect(screen.getByText("Start")).toHaveAttribute("data-allow-font-scaling", "true");
  });
});
