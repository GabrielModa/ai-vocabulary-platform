// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import VocabularyPage from "./page.js";
import {
  readInterruptedStudySession,
  saveInterruptedStudySession,
} from "./interrupted-study-session";
import { appendCompletedStudySession, readCompletedStudySessions } from "./local-study-history";

const generatedSet = {
  title: "Your football word set",
  candidates: [
    {
      candidateId: "candidate:pitch",
      senseId: "sense:pitch",
      term: "pitch",
      meaning: "The playing surface.",
      type: "noun",
      example: "The pitch is wet.",
      challenge: "The players walked onto the ___ before the match.",
      contexts: [
        "The pitch is wet.",
        "They discussed the pitch before kickoff.",
        "The groundskeeper inspected the pitch.",
      ],
    },
    {
      candidateId: "candidate:pass",
      senseId: "sense:pass",
      term: "pass",
      meaning: "To send the ball to a teammate.",
      type: "verb",
      example: "Pass the ball.",
      challenge: "Please ___ the ball.",
    },
    {
      candidateId: "candidate:close-match",
      senseId: "sense:close-match",
      term: "close match",
      meaning: "A game with a small score difference.",
      type: "collocation",
      example: "It was a close match.",
      challenge: "The final was a ___.",
    },
    {
      candidateId: "candidate:goalkeeper",
      senseId: "sense:goalkeeper",
      term: "goalkeeper",
      meaning: "The player who protects the goal.",
      type: "noun",
      example: "The goalkeeper saved the shot.",
      challenge: "The ___ saved the shot.",
    },
  ],
};

function responseJson(value: unknown, status = 200): Response {
  return new Response(JSON.stringify(value), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function generationEnvelope(generation: typeof generatedSet, draftId = "draft-1") {
  return {
    generation,
    draft: {
      draftId,
      expiresAt: "2027-01-01T00:00:00.000Z",
    },
  };
}

function fetchForGeneration(
  generation: typeof generatedSet,
  draftId = "draft-1",
  sessionId = "study-session-1",
) {
  return vi.fn((input: RequestInfo | URL) => {
    const url =
      typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;

    if (url.endsWith("/api/vocabulary/generate")) {
      return Promise.resolve(responseJson(generationEnvelope(generation, draftId)));
    }

    if (url.includes("/api/vocabulary/drafts/") && url.endsWith("/resolve")) {
      return Promise.resolve(
        responseJson({
          draftId: `${draftId}-resolved`,
          expiresAt: "2027-01-01T00:30:00.000Z",
          publishedCandidateIds: generation.candidates.map(({ candidateId }) => candidateId),
          omittedCandidateIds: [],
        }),
      );
    }

    if (url.endsWith("/api/study-sessions")) {
      return Promise.resolve(
        responseJson(
          {
            sessionId,
            title: generation.title,
            level: "B1",
            exercises: [],
          },
          201,
        ),
      );
    }

    if (url.includes("/api/vocabulary/image")) {
      return Promise.resolve(responseJson({ status: "unavailable" }));
    }

    return Promise.resolve(responseJson({ code: "NOT_FOUND" }, 404));
  });
}

const ambiguousGeneratedSet = {
  ...generatedSet,
  candidates: generatedSet.candidates.map((candidate, index) =>
    index !== 0
      ? { ...candidate, lexicalValidationStatus: "verified" }
      : {
          ...candidate,
          lexicalValidationStatus: "provisional",
          lexicalSenses: [
            {
              word: "pitch",
              normalizedWord: "pitch",
              senseId: "oewn-playing-surface-n",
              partOfSpeech: "noun",
              definition: "The playing surface used for a sport.",
              provenance: {
                provider: "oewn",
                sourceId: "oewn-playing-surface-n",
                license: "CC BY 4.0",
                attribution: "Open English WordNet",
                retrievedAt: "2026-08-03T00:00:00.000Z",
                generated: false,
                validationStatus: "verified",
              },
            },
            {
              word: "pitch",
              normalizedWord: "pitch",
              senseId: "oewn-musical-frequency-n",
              partOfSpeech: "noun",
              definition: "The perceived frequency of a sound.",
              provenance: {
                provider: "oewn",
                sourceId: "oewn-musical-frequency-n",
                license: "CC BY 4.0",
                attribution: "Open English WordNet",
                retrievedAt: "2026-08-03T00:00:00.000Z",
                generated: false,
                validationStatus: "verified",
              },
            },
          ],
        },
  ),
};

beforeEach(() => {
  window.localStorage.clear();
  vi.stubGlobal("fetch", fetchForGeneration(generatedSet));
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
  it("analyzes a consented photo locally before opening candidate review", async () => {
    const generationFetch = fetchForGeneration(generatedSet);
    const photoFetch = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      void init;
      const url =
        typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
      if (url === "/api/vocabulary/photo")
        return Promise.resolve(
          new Response(JSON.stringify({ terms: ["pitch", "goal", "ball", "player"] }), {
            status: 200,
          }),
        );
      return generationFetch(input);
    });
    vi.stubGlobal("fetch", photoFetch);
    render(<VocabularyPage />);
    fireEvent.click(screen.getByRole("button", { name: /Photo/u }));
    const photo = screen.getByLabelText("Photo");
    fireEvent.change(photo, {
      target: {
        files: [
          new File([new Uint8Array([0xff, 0xd8, 0xff])], "field.jpg", { type: "image/jpeg" }),
        ],
      },
    });
    fireEvent.click(screen.getByRole("checkbox", { name: /temporary photo processing/u }));
    const form = screen.getByRole("button", { name: /Create my word set/u }).closest("form");
    if (!form) throw new Error("missing capture form");
    fireEvent.submit(form);

    expect(
      await screen.findByRole("heading", { level: 2, name: "Your football word set" }),
    ).toBeInTheDocument();
    const photoCall = photoFetch.mock.calls[0];
    expect(photoCall?.[0]).toBe("/api/vocabulary/photo");
    expect(photoCall?.[1]?.method).toBe("POST");
    expect(photoCall?.[1]?.body).toBeInstanceOf(FormData);
    const generationCall = photoFetch.mock.calls[1];
    expect(generationCall?.[0]).toBe("/api/vocabulary/generate");
    expect(generationCall?.[1]?.body).toContain("pitch, goal, ball, player");
  });
  it("shows explicit selectable review before training", async () => {
    render(<VocabularyPage />);
    fireEvent.change(screen.getByLabelText("Number of words"), { target: { value: "4" } });
    const form = screen.getByRole("button", { name: /Create my word set/u }).closest("form");
    if (!form) throw new Error("missing capture form");
    fireEvent.submit(form);
    expect(
      await screen.findByRole("heading", { level: 2, name: "Your football word set" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("4 selected");
    expect(screen.getByRole("button", { name: "Study mode" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /start training/u })).toBeEnabled();
    expect(screen.queryByText("The playing surface.")).not.toBeInTheDocument();
    expect(screen.queryByText("The pitch is wet.")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Listen to pitch" })).toBeInTheDocument();
  });

  it("shows an honest locally derived notice when generation is partial", async () => {
    const partial = {
      ...generatedSet,
      candidates: generatedSet.candidates.slice(0, 2),
      generationFulfillment: {
        status: "partial",
        requestedCount: 4,
        deliveredCount: 2,
        deficitCount: 2,
        attempts: 3,
        message: "<script>untrusted</script>",
      },
    };
    vi.stubGlobal("fetch", fetchForGeneration(partial));
    render(<VocabularyPage />);
    fireEvent.change(screen.getByLabelText("Number of words"), { target: { value: "4" } });
    const form = screen.getByRole("button", { name: /Create my word set/u }).closest("form");
    if (!form) throw new Error("missing capture form");
    fireEvent.submit(form);

    expect(await screen.findByText("2 of 4 useful words are ready.")).toBeInTheDocument();
    expect(screen.getByText("Try a broader topic or request a smaller set.")).toBeInTheDocument();
    expect(screen.queryByText(/untrusted/u)).not.toBeInTheDocument();
  });

  it("keeps Test retrieval-first and reveals verified content only in Study mode", async () => {
    render(<VocabularyPage />);
    const form = screen.getByRole("button", { name: /Create my word set/u }).closest("form");
    if (!form) throw new Error("missing capture form");
    fireEvent.submit(form);
    await screen.findByRole("heading", { level: 2, name: "Your football word set" });

    expect(screen.getByRole("button", { name: "Test mode" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.queryByText("The playing surface.")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Study mode" }));

    expect(screen.getByText("The playing surface.")).toBeInTheDocument();
    expect(screen.getByText("The pitch is wet.")).toBeInTheDocument();
    expect(screen.getByText("They discussed the pitch before kickoff.")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Listen to the meaning of pitch" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Listen to the example for pitch" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Listen to context 2 for pitch" }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Test mode" }));
    expect(screen.queryByText("The playing surface.")).not.toBeInTheDocument();
    expect(screen.queryByText("The pitch is wet.")).not.toBeInTheDocument();
  });

  it("creates a draft-backed study session before training", async () => {
    render(<VocabularyPage />);
    const form = screen.getByRole("button", { name: /Create my word set/u }).closest("form");
    if (!form) throw new Error("missing capture form");
    fireEvent.submit(form);
    await screen.findByRole("heading", { level: 2, name: "Your football word set" });

    fireEvent.click(screen.getByRole("button", { name: /start training/u }));

    expect(await screen.findByText("Your study session is ready.")).toBeInTheDocument();
    expect(screen.queryByText(/study-session-1/u)).not.toBeInTheDocument();
    expect(vi.mocked(fetch)).toHaveBeenCalledWith(
      "/api/study-sessions",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          draftId: "draft-1-resolved",
          title: "Your football word set",
          level: "B1",
          selectedCandidateIds: [
            "candidate:pitch",
            "candidate:pass",
            "candidate:close-match",
            "candidate:goalkeeper",
          ],
        }),
      }),
    );
  });

  it("does not start when final verification publishes fewer than four candidates", async () => {
    const baseFetch = fetchForGeneration(generatedSet);
    vi.stubGlobal(
      "fetch",
      vi.fn((input: RequestInfo | URL) => {
        const url =
          typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
        if (url.includes("/api/vocabulary/drafts/") && url.endsWith("/resolve")) {
          return Promise.resolve(
            responseJson({
              draftId: "draft-verified-subset",
              publishedCandidateIds: generatedSet.candidates
                .slice(0, 3)
                .map(({ candidateId }) => candidateId),
              omittedCandidateIds: [generatedSet.candidates[3]?.candidateId],
            }),
          );
        }
        return baseFetch(input);
      }),
    );
    render(<VocabularyPage />);
    const form = screen.getByRole("button", { name: /Create my word set/u }).closest("form");
    if (!form) throw new Error("missing capture form");
    fireEvent.submit(form);
    await screen.findByRole("heading", { level: 2, name: "Your football word set" });
    fireEvent.click(screen.getByRole("button", { name: /start training/u }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Only 3 words produced verified exercises. Select or generate at least 4.",
    );
    expect(screen.queryByText("Question 1 of 4")).not.toBeInTheDocument();
  });
  it("runs the complete training flow without requesting visual clues", async () => {
    render(<VocabularyPage />);
    fireEvent.click(screen.getByRole("checkbox", { name: /Use visual clues/u }));
    const form = screen.getByRole("button", { name: /Create my word set/u }).closest("form");
    if (!form) throw new Error("missing capture form");
    fireEvent.submit(form);
    await screen.findByRole("heading", { level: 2, name: "Your football word set" });
    fireEvent.click(screen.getByRole("button", { name: /start training/u }));

    expect(await screen.findByText("Training without visual clues.")).toBeInTheDocument();
    expect(screen.queryByText(/Creating a safe visual clue/u)).not.toBeInTheDocument();
    expect(vi.mocked(fetch)).not.toHaveBeenCalledWith(
      expect.stringContaining("/api/vocabulary/image"),
      expect.anything(),
    );
  });
  it("offers explicit continuation of a validated interrupted training session", async () => {
    saveInterruptedStudySession(window.localStorage, {
      version: 1,
      savedAt: new Date().toISOString(),
      title: generatedSet.title,
      level: "B1",
      candidates: generatedSet.candidates,
      selectedTerms: generatedSet.candidates.map(({ term }) => term),
      questionIndex: 1,
      chosenTerm: "pitch",
      feedback: "incorrect",
      attempts: [{ term: "pass", chosenTerm: "pitch", correct: false }],
    });

    render(<VocabularyPage />);
    fireEvent.click(await screen.findByRole("button", { name: "Continue session" }));

    expect(screen.getByText("Question 2 of 4")).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /pitch/u })).toBeChecked();
    expect(screen.getByRole("status")).toHaveTextContent("Not quite");
    expect(screen.getByText("Restored from this device.")).toBeInTheDocument();
  });

  it("discards an interrupted session without restoring it", async () => {
    saveInterruptedStudySession(window.localStorage, {
      version: 1,
      savedAt: new Date().toISOString(),
      title: generatedSet.title,
      level: "B1",
      candidates: generatedSet.candidates,
      selectedTerms: generatedSet.candidates.map(({ term }) => term),
      questionIndex: 0,
      attempts: [],
    });

    render(<VocabularyPage />);
    fireEvent.click(await screen.findByRole("button", { name: "Discard saved session" }));

    expect(screen.queryByRole("button", { name: "Continue session" })).not.toBeInTheDocument();
    expect(readInterruptedStudySession(window.localStorage)).toBeUndefined();
    expect(
      screen.getByRole("heading", { name: "What do you want to learn from?" }),
    ).toBeInTheDocument();
  });
  it("shows recent completed practice without describing it as mastery", () => {
    appendCompletedStudySession(window.localStorage, {
      version: 1,
      sessionId: "history-session-1",
      completedAt: "2026-08-11T12:00:00.000Z",
      title: generatedSet.title,
      level: "B1",
      candidates: generatedSet.candidates,
      selectedTerms: generatedSet.candidates.map(({ term }) => term),
      attempts: [
        { term: "pitch", chosenTerm: "pass", correct: false },
        { term: "pass", chosenTerm: "pass", correct: true },
      ],
      score: { correct: 1, attempted: 2, percentage: 50 },
    });

    render(<VocabularyPage />);

    expect(screen.getByRole("heading", { name: "Recent practice" })).toBeInTheDocument();
    expect(screen.getByText(generatedSet.title)).toBeInTheDocument();
    expect(screen.getByText("50% · 1 of 2 correct")).toBeInTheDocument();
    expect(screen.getByText(/Attempt history only/u)).toBeInTheDocument();
    expect(screen.queryByText(/mastered/u)).not.toBeInTheDocument();
  });
  it("starts a local adaptive review without generation when visual clues are disabled", () => {
    const completedAt = new Date(Date.now() - 2 * 24 * 60 * 60 * 1_000).toISOString();
    appendCompletedStudySession(window.localStorage, {
      version: 1,
      sessionId: "adaptive-history-1",
      completedAt,
      title: generatedSet.title,
      level: "B1",
      candidates: generatedSet.candidates,
      selectedTerms: generatedSet.candidates.map(({ term }) => term),
      attempts: [
        { term: "pitch", chosenTerm: "pass", correct: false },
        { term: "pass", chosenTerm: "pass", correct: true },
        { term: "close match", chosenTerm: "close match", correct: true },
        { term: "goalkeeper", chosenTerm: "goalkeeper", correct: true },
      ],
      score: { correct: 3, attempted: 4, percentage: 75 },
    });

    render(<VocabularyPage />);
    expect(screen.getByText("4 due · 0 new · 0 early review")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("checkbox", { name: /Use visual clues/u }));
    vi.mocked(fetch).mockClear();
    fireEvent.click(screen.getByRole("button", { name: "Start adaptive review" }));

    expect(screen.getByText("Question 1 of 4")).toBeInTheDocument();
    expect(screen.getByText("Training without visual clues.")).toBeInTheDocument();
    expect(vi.mocked(fetch)).not.toHaveBeenCalled();
  });
  it("uses typed recall after repeated successful retrievals", () => {
    for (let index = 0; index < 4; index += 1) {
      appendCompletedStudySession(window.localStorage, {
        version: 1,
        sessionId: `typed-history-${String(index)}`,
        completedAt: new Date(Date.now() - (40 - index * 7) * 24 * 60 * 60 * 1_000).toISOString(),
        title: generatedSet.title,
        level: "B1",
        candidates: generatedSet.candidates,
        selectedTerms: ["pitch"],
        attempts: [{ term: "pitch", chosenTerm: "pitch", correct: true }],
        score: { correct: 1, attempted: 1, percentage: 100 },
      });
    }

    render(<VocabularyPage />);
    fireEvent.click(screen.getByRole("checkbox", { name: /Use visual clues/u }));
    fireEvent.click(screen.getByRole("button", { name: "Start adaptive review" }));

    expect(
      screen.getByRole("heading", { name: "Type the word that completes the sentence" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("radio")).not.toBeInTheDocument();
    fireEvent.change(screen.getByRole("textbox", { name: "Type your answer" }), {
      target: { value: " PiTcH " },
    });
    fireEvent.click(screen.getByRole("button", { name: /Check my answer/u }));
    expect(screen.getByText("Correct!", { selector: "p" })).toBeInTheDocument();
  });
  it("requires explicit confirmation for an ambiguous selected meaning", async () => {
    vi.stubGlobal(
      "fetch",
      fetchForGeneration(ambiguousGeneratedSet, "draft-ambiguous", "study-session-ambiguous"),
    );
    render(<VocabularyPage />);
    const form = screen.getByRole("button", { name: /Create my word set/u }).closest("form");
    if (!form) throw new Error("missing capture form");
    fireEvent.submit(form);
    await screen.findByRole("heading", { level: 2, name: "Your football word set" });

    const start = screen.getByRole("button", { name: /start training/u });
    expect(start).toBeDisabled();
    expect(screen.queryByText("The playing surface used for a sport.")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Confirm meaning for pitch" }));
    expect(screen.getByText("The playing surface used for a sport.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("radio", { name: "The playing surface used for a sport." }));
    fireEvent.click(screen.getByRole("button", { name: "Use selected meaning for pitch" }));

    expect(start).toBeEnabled();
    expect(screen.queryByText("Meaning confirmed")).not.toBeInTheDocument();
    fireEvent.click(start);
    expect(
      await screen.findByRole("heading", {
        name: "Which word matches the verified meaning?",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Which word matches this meaning.*playing surface used for a sport/u),
    ).toBeInTheDocument();
  });
  it("connects confirmation to retrieval and immediate feedback", async () => {
    render(<VocabularyPage />);
    const captureForm = screen.getByRole("button", { name: /Create my word set/u }).closest("form");
    if (!captureForm) throw new Error("missing capture form");
    fireEvent.submit(captureForm);
    await screen.findByRole("heading", { level: 2, name: "Your football word set" });
    fireEvent.click(screen.getByRole("button", { name: /start training/u }));
    expect(
      await screen.findByRole("heading", {
        name: "Which word completes the sentence?",
      }),
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
    expect(readCompletedStudySessions(window.localStorage)).toHaveLength(1);
    expect(readCompletedStudySessions(window.localStorage)[0]?.score).toEqual({
      correct: 3,
      attempted: 4,
      percentage: 75,
    });

    fireEvent.click(screen.getByRole("button", { name: "Practice wrong words" }));
    expect(screen.getByText("Question 1 of 1")).toBeInTheDocument();
    expect(screen.getByText(/players walked onto the ___ before the match/u)).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "75% correct" })).not.toBeInTheDocument();
  });
});
