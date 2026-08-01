// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ErrorPage from "./error.js";

describe("ErrorPage", () => {
  it("offers an accessible recovery action without exposing error details", () => {
    const reset = vi.fn();
    render(<ErrorPage error={new Error("private internal detail")} reset={reset} />);
    expect(screen.queryByText("private internal detail")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(reset).toHaveBeenCalledOnce();
  });
});
