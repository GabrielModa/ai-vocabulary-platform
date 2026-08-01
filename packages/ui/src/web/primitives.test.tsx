// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { designTokens } from "../tokens.js";
import { Button, Surface, Text } from "./primitives.js";
import { webAccessibilityStyles } from "./styles.js";

describe("web primitives", () => {
  it("supports keyboard activation, an accessible name, and a minimum target", () => {
    const onClick = vi.fn();
    render(
      <Button aria-label="Start practice" data-ui-button onClick={onClick}>
        Start
      </Button>,
    );
    const button = screen.getByRole("button", { name: "Start practice" });
    button.focus();
    fireEvent.keyDown(button, { key: "Enter" });
    fireEvent.click(button);
    expect(button).toHaveFocus();
    expect(onClick).toHaveBeenCalledOnce();
    expect(button).toHaveStyle({
      minHeight: `${String(designTokens.state.minTarget)}px`,
      minWidth: `${String(designTokens.state.minTarget)}px`,
    });
  });

  it("announces and disables a loading action", () => {
    render(<Button busy>Saving</Button>);
    expect(screen.getByRole("button", { name: "Saving" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Saving" })).toHaveAttribute("aria-busy", "true");
  });

  it("composes semantic text and surfaces", () => {
    render(
      <Surface aria-label="Feedback">
        <Text tone="success">Correct</Text>
      </Surface>,
    );
    expect(screen.getByRole("region", { name: "Feedback" })).toHaveTextContent("Correct");
  });

  it("keeps focus feedback and removes nonessential reduced-motion transitions", () => {
    expect(webAccessibilityStyles).toContain(":focus-visible");
    expect(webAccessibilityStyles).toContain("prefers-reduced-motion: reduce");
    expect(webAccessibilityStyles).toContain("transition-duration: 0ms");
  });
});
