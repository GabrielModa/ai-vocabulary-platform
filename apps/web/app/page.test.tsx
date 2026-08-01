// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import FoundationPage from "./page.js";

describe("FoundationPage", () => {
  it("exposes one clear status with semantic structure", () => {
    render(<FoundationPage />);
    expect(screen.getByRole("main")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 1, name: "Your vocabulary. Your world." }),
    ).toBeInTheDocument();
    expect(screen.getByRole("status", { name: "Application status" })).toHaveTextContent(
      "Web foundation ready",
    );
  });
});
