// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ErrorPage from "./error";

describe("operator error boundary", () => {
  it("provides a generic accessible recovery action", () => {
    const reset = vi.fn();
    render(<ErrorPage error={new Error("sensitive detail")} reset={reset} />);

    expect(screen.getByRole("alert")).toHaveAccessibleName("The request could not be completed");
    expect(screen.queryByText("sensitive detail")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(reset).toHaveBeenCalledOnce();
  });
});
