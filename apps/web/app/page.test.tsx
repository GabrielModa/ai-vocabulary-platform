// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import VocabularyPage from "./page.js";

afterEach(cleanup);

describe("VocabularyPage", () => {
  it("offers words, topic, and photo capture with CEFR levels", () => {
    render(<VocabularyPage />);
    expect(
      screen.getByRole("heading", { level: 1, name: "Turn your world into English practice." }),
    ).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "Vocabulary source" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Words/u })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Topic/u })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: /Photo/u })).toBeInTheDocument();
    expect(screen.getByLabelText("English level")).toHaveValue("B1");
  });
  it("shows explicit editable review before training", () => {
    render(<VocabularyPage />);
    const form = screen.getByRole("button", { name: /Create my word set/u }).closest("form");
    if (!form) throw new Error("missing capture form");
    fireEvent.submit(form);
    expect(
      screen.getByRole("heading", { level: 2, name: "Your football word set" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("3 selected");
    expect(screen.getByRole("button", { name: "Edit pitch" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Confirm and start training/u })).toBeEnabled();
  });
});
