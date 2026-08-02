// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import VocabularyPage from "./page.js";

const generatedSet = {
  title: "Your football word set",
  candidates: [
    {
      term: "pitch",
      meaning: "The playing surface.",
      type: "noun",
      example: "The pitch is wet.",
      challenge: "The players walked onto the ___ before the match.",
    },
    {
      term: "pass",
      meaning: "To send the ball to a teammate.",
      type: "verb",
      example: "Pass the ball.",
      challenge: "Please ___ the ball.",
    },
    {
      term: "close match",
      meaning: "A game with a small score difference.",
      type: "collocation",
      example: "It was a close match.",
      challenge: "The final was a ___.",
    },
    {
      term: "goalkeeper",
      meaning: "The player who protects the goal.",
      type: "noun",
      example: "The goalkeeper saved the shot.",
      challenge: "The ___ saved the shot.",
    },
  ],
};

beforeEach(() => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(
      new Response(JSON.stringify(generatedSet), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    ),
  );
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

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
  it("shows explicit editable review before training", async () => {
    render(<VocabularyPage />);
    const form = screen.getByRole("button", { name: /Create my word set/u }).closest("form");
    if (!form) throw new Error("missing capture form");
    fireEvent.submit(form);
    expect(
      await screen.findByRole("heading", { level: 2, name: "Your football word set" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("4 selected");
    expect(screen.getByRole("button", { name: "Edit pitch" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /start training/u })).toBeEnabled();
    expect(screen.queryByText("The playing surface.")).not.toBeInTheDocument();
    expect(screen.queryByText("The pitch is wet.")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Listen to pitch" })).toBeInTheDocument();
  });
  it("connects confirmation to retrieval and immediate feedback", async () => {
    render(<VocabularyPage />);
    const captureForm = screen.getByRole("button", { name: /Create my word set/u }).closest("form");
    if (!captureForm) throw new Error("missing capture form");
    fireEvent.submit(captureForm);
    await screen.findByRole("heading", { level: 2, name: "Your football word set" });
    fireEvent.click(screen.getByRole("button", { name: /start training/u }));
    expect(
      screen.getByRole("heading", { name: "Which word completes the sentence?" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/players walked onto the ___ before the match/u)).toBeInTheDocument();
    expect(screen.getAllByRole("radio")).toHaveLength(4);
    fireEvent.click(screen.getByRole("radio", { name: /pass/u }));
    fireEvent.click(screen.getByRole("button", { name: /Check my answer/u }));
    expect(screen.getByRole("status")).toHaveTextContent("Not quite — keep going.");
    expect(screen.getByRole("status")).toHaveTextContent("The answer is “pitch”.");
    fireEvent.click(screen.getByRole("button", { name: /Next question/u }));
    expect(screen.getByText("Question 2 of 4")).toBeInTheDocument();
    expect(screen.queryByText(/Session complete/u)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Previous question/u }));
    expect(screen.getByText("Question 1 of 4")).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /pass/u })).toBeChecked();
    expect(screen.getByRole("status")).toHaveTextContent("Not quite — keep going.");
    fireEvent.click(screen.getByRole("button", { name: /Next question/u }));
    fireEvent.click(screen.getByRole("radio", { name: /pass/u }));
    fireEvent.click(screen.getByRole("button", { name: /Check my answer/u }));
    fireEvent.click(screen.getByRole("button", { name: /Next question/u }));
    fireEvent.click(screen.getByRole("radio", { name: /close match/u }));
    fireEvent.click(screen.getByRole("button", { name: /Check my answer/u }));
    fireEvent.click(screen.getByRole("button", { name: /Next question/u }));
    fireEvent.click(screen.getByRole("radio", { name: /goalkeeper/u }));
    fireEvent.click(screen.getByRole("button", { name: /Check my answer/u }));
    fireEvent.click(screen.getByRole("button", { name: /Finish session/u }));
    expect(screen.getByRole("heading", { name: "75% correct" })).toBeInTheDocument();
    expect(screen.getByText("You chose: pass")).toBeInTheDocument();
    expect(screen.getAllByText("Correct", { selector: "span" })).toHaveLength(3);
  });
});
