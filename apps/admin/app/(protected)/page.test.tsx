// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import ProtectedPage from "./page";

describe("protected operator placeholder", () => {
  it("renders an accessible generic denial without resource details", async () => {
    render(await ProtectedPage());

    expect(screen.getByRole("alert")).toHaveAccessibleName("Access denied");
    expect(screen.getByText("Your request cannot be completed.")).toBeVisible();
    expect(screen.queryByText(/operator\.shell/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/dashboard/i)).not.toBeInTheDocument();
  });
});
