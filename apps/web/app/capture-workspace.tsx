"use client";

import Image from "next/image";
import { useEffect, useState, type SyntheticEvent } from "react";
import {
  candidateAnswerOptions,
  candidateCorrectAnswer,
  candidateSentenceWithGap,
  compatibleLexicalSenses,
  countUnresolvedSelectedCandidates,
  requiresSenseConfirmation,
  resolveCandidateSense,
  type ReviewCandidate,
} from "./lexical-review";
import {
  applySensePreference,
  readSensePreferences,
  writeSensePreference,
} from "./sense-preferences";

type Mode = "words" | "topic" | "photo";
const modeCopy: Record<Mode, { title: string; description: string }> = {
  words: {
    title: "Type your words",
    description: "Use English or any language. Separate words with commas or new lines.",
  },
  topic: {
    title: "Build from a topic",
    description: "Choose a context and how many useful English words you want.",
  },
  photo: {
    title: "Learn from a photo",
    description: "Upload a page or object. The photo is processed temporarily and then deleted.",
  },
};
type Candidate = ReviewCandidate;

interface GenerationEnvelope {
  readonly generation: {
    readonly title: string;
    readonly candidates: readonly Candidate[];
  };
  readonly draft: {
    readonly draftId: string;
    readonly expiresAt: string;
  };
}

interface CreatedStudySession {
  readonly sessionId: string;
}

interface Attempt {
  readonly term: string;
  readonly chosenTerm: string;
  readonly correct: boolean;
  readonly voided?: boolean;
}

interface ImageJob {
  readonly id?: string;
  readonly status: string;
  readonly error?: string | null;
  readonly imagePath?: string | null;
}

const IMAGE_POLL_INTERVAL_MS = 2_500;
const IMAGE_JOB_TIMEOUT_MS = 180_000;

async function enqueueImage(candidate: Candidate, level: string): Promise<ImageJob | undefined> {
  try {
    const response = await fetch("/api/vocabulary/image", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        term: candidate.term,
        meaning: candidate.meaning,
        context:
          candidate.exerciseKind === "definition-choice" ? candidate.meaning : candidate.example,
        level,
      }),
    });
    return (await response.json()) as ImageJob;
  } catch {
    return undefined;
  }
}

function PracticeImage({ candidate, level }: { candidate: Candidate; level: string }) {
  const [job, setJob] = useState<ImageJob>();
  useEffect(() => {
    let active = true;
    let timeout: ReturnType<typeof setTimeout> | undefined;
    const controller = new AbortController();
    const deadline = Date.now() + IMAGE_JOB_TIMEOUT_MS;
    async function poll(nextJob?: ImageJob) {
      try {
        const current = nextJob ?? (await enqueueImage(candidate, level));
        if (!active || !current) return;
        setJob(current);
        if (["queued", "generating"].includes(current.status) && current.id) {
          if (Date.now() >= deadline) {
            setJob({ ...current, status: "unavailable", error: "image_job_timeout" });
            return;
          }
          const jobId = current.id;
          timeout = setTimeout(() => {
            void fetch(`/api/vocabulary/image/${jobId}`, {
              cache: "no-store",
              signal: controller.signal,
            })
              .then((response) =>
                response.ok ? (response.json() as Promise<ImageJob>) : undefined,
              )
              .then((updated) => {
                if (!active) return;
                void poll(updated ?? current);
              })
              .catch(() => {
                if (active && !controller.signal.aborted) void poll(current);
              });
          }, IMAGE_POLL_INTERVAL_MS);
        }
      } catch {
        if (active && !controller.signal.aborted) setJob({ status: "unavailable" });
      }
    }
    void poll();
    return () => {
      active = false;
      controller.abort();
      if (timeout) clearTimeout(timeout);
    };
  }, [candidate, level]);

  if (job?.id && ["approved", "ready"].includes(job.status)) {
    return (
      <figure className="practice-image ready">
        <Image
          unoptimized
          width={512}
          height={512}
          src={`/api/vocabulary/image/${job.id}?file=1`}
          alt="Educational visual clue for this exercise"
        />
        <figcaption>Visual clue · generated and checked locally</figcaption>
      </figure>
    );
  }
  const terminalCopy: Record<string, { title: string; detail: string }> = {
    rejected: {
      title: "Visual clue withheld for this context.",
      detail: "The vocabulary exercise remains available without an image.",
    },
    failed: {
      title: "The local image could not be generated.",
      detail: "You can continue learning and try images again in another session.",
    },
    unavailable: {
      title: "The local image service is unavailable.",
      detail: "The exercise still works normally without the visual clue.",
    },
  };
  const terminal = terminalCopy[job?.status ?? "unavailable"];
  return (
    <div className="practice-image placeholder" aria-live="polite">
      <span aria-hidden="true">◌</span>
      <p>{terminal?.title ?? "Creating a safe visual clue in the background…"}</p>
      <small>{terminal?.detail ?? "You can keep learning while it is prepared."}</small>
    </div>
  );
}

function formText(form: FormData, name: string): string {
  const value = form.get(name);
  return typeof value === "string" ? value : "";
}

function sentenceWithGap(candidate: Candidate): string {
  return candidateSentenceWithGap(candidate);
}

function speak(text: string) {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";
  utterance.rate = 0.88;
  window.speechSynthesis.speak(utterance);
}

function speakSentenceWithGap(text: string) {
  if (!("speechSynthesis" in window)) return;
  const [before = "", after = ""] = text.split("___", 2);
  window.speechSynthesis.cancel();
  for (const part of [before.trim(), after.trim()].filter(Boolean)) {
    const utterance = new SpeechSynthesisUtterance(part);
    utterance.lang = "en-US";
    utterance.rate = 0.82;
    window.speechSynthesis.speak(utterance);
  }
}

export function CaptureWorkspace() {
  const [mode, setMode] = useState<Mode>("topic");
  const [reviewing, setReviewing] = useState(false);
  const [training, setTraining] = useState(false);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [chosenTerm, setChosenTerm] = useState<string>();
  const [feedback, setFeedback] = useState<"correct" | "incorrect">();
  const [score, setScore] = useState(0);
  const [attempts, setAttempts] = useState<readonly Attempt[]>([]);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [candidates, setCandidates] = useState<readonly Candidate[]>([]);
  const [title, setTitle] = useState("My word set");
  const [selected, setSelected] = useState(() => new Set<string>());
  const [expandedMeanings, setExpandedMeanings] = useState(() => new Set<string>());
  const [selectedSenseIds, setSelectedSenseIds] = useState<Record<string, string>>({});
  const [confirmedMeanings, setConfirmedMeanings] = useState(() => new Set<string>());
  const [loading, setLoading] = useState(false);
  const [creatingSession, setCreatingSession] = useState(false);
  const [error, setError] = useState<string>();
  const [level, setLevel] = useState("B1");
  const [draftId, setDraftId] = useState<string>();
  const [draftExpiresAt, setDraftExpiresAt] = useState<string>();
  const [studySessionId, setStudySessionId] = useState<string>();
  const [meaningCorrectionTerm, setMeaningCorrectionTerm] = useState<string>();
  const [meaningCorrectionStatus, setMeaningCorrectionStatus] = useState<string>();
  async function submit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    if (mode === "photo") {
      setError("Photo analysis needs a vision model. Topic and words modes are ready now.");
      return;
    }
    const form = new FormData(event.currentTarget);
    const topic = mode === "topic" ? formText(form, "topic") : formText(form, "words");
    const requestedCount =
      mode === "topic"
        ? Number(form.get("count"))
        : Math.max(4, topic.split(/[,;\n]+/u).filter(Boolean).length);
    setLoading(true);
    setError(undefined);
    try {
      const requestedLevel = formText(form, "level");
      const response = await fetch("/api/vocabulary/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ topic, requestedCount, level: requestedLevel }),
      });
      if (!response.ok) throw new Error("generation failed");
      const result = (await response.json()) as GenerationEnvelope;
      const preferences =
        typeof window === "undefined" ? {} : readSensePreferences(window.localStorage);
      const preferredCandidates = result.generation.candidates.map((candidate) =>
        applySensePreference(candidate, preferences),
      );
      setCandidates(preferredCandidates);
      setTitle(result.generation.title);
      setDraftId(result.draft.draftId);
      setDraftExpiresAt(result.draft.expiresAt);
      setStudySessionId(undefined);
      setSelected(new Set(preferredCandidates.map(({ term }) => term)));
      setExpandedMeanings(new Set());
      setSelectedSenseIds({});
      setConfirmedMeanings(new Set());
      setLevel(requestedLevel);
      setReviewing(true);
      for (const candidate of preferredCandidates
        .filter((item) => !requiresSenseConfirmation(item))
        .slice(0, 4))
        void enqueueImage(candidate, requestedLevel);
    } catch {
      setError("Local AI could not generate this set. Make sure Ollama is running and try again.");
    } finally {
      setLoading(false);
    }
  }
  async function createStudySession() {
    if (!draftId || selected.size < 4 || unresolvedSelectedCount > 0) return;

    const selectedCandidateIds = candidates
      .filter((candidate) => selected.has(candidate.term))
      .map((candidate) => candidate.candidateId)
      .filter((candidateId): candidateId is string => Boolean(candidateId));

    if (selectedCandidateIds.length !== selected.size) {
      setError("This generated set is missing secure candidate references. Generate it again.");
      return;
    }

    setCreatingSession(true);
    setError(undefined);
    try {
      const selections = candidates
        .filter((candidate) => selected.has(candidate.term))
        .map((candidate) => ({
          candidateId: candidate.candidateId,
          senseId: candidate.senseId,
        }))
        .filter(
          (
            selection,
          ): selection is {
            readonly candidateId: string;
            readonly senseId: string;
          } => Boolean(selection.candidateId && selection.senseId),
        );

      if (selections.length !== selected.size) {
        setError("Confirm the intended meaning for every selected word before training.");
        return;
      }

      const resolution = await fetch(
        `/api/vocabulary/drafts/${encodeURIComponent(draftId)}/resolve`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ selections }),
        },
      );

      if (!resolution.ok) {
        if (resolution.status === 401) {
          setError("Sign in again before resolving this generated set.");
        } else if (resolution.status === 404) {
          setError("This generated set expired. Generate a new set to continue.");
        } else {
          setError("The reviewed words could not produce verified exercises.");
        }
        return;
      }

      const resolved = (await resolution.json()) as {
        readonly draftId: string;
        readonly publishedCandidateIds: readonly string[];
      };
      const published = new Set(resolved.publishedCandidateIds);
      const publishedCandidateIds = selectedCandidateIds.filter((candidateId) =>
        published.has(candidateId),
      );

      if (publishedCandidateIds.length === 0) {
        setError("The reviewed words could not produce verified exercises.");
        return;
      }

      const response = await fetch("/api/study-sessions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          draftId: resolved.draftId,
          title,
          level,
          selectedCandidateIds: publishedCandidateIds,
        }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          setError("Sign in again before starting this study session.");
        } else if (response.status === 404) {
          setError("This generated set expired. Generate a new set to continue.");
        } else if (response.status === 400) {
          setError("Review your selected words and try creating the session again.");
        } else {
          setError("The study session could not be created. Try again.");
        }
        return;
      }

      const session = (await response.json()) as CreatedStudySession;
      setStudySessionId(session.sessionId);
      setTraining(true);
    } catch {
      setError("The study session service is unavailable. Try again.");
    } finally {
      setCreatingSession(false);
    }
  }

  function toggle(term: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(term)) next.delete(term);
      else next.add(term);
      return next;
    });
  }

  const trainingCandidates = candidates.filter(({ term }) => selected.has(term));
  const unresolvedSelectedCount = countUnresolvedSelectedCandidates(candidates, selected);
  const currentCandidate = trainingCandidates[questionIndex];
  const optionPool = currentCandidate
    ? candidateAnswerOptions(currentCandidate, trainingCandidates)
    : [];
  const optionOffset = optionPool.length === 0 ? 0 : questionIndex % optionPool.length;
  const answerOptions = [...optionPool.slice(optionOffset), ...optionPool.slice(0, optionOffset)];

  function checkAnswer() {
    if (!chosenTerm || !currentCandidate || feedback) return;
    const correct = chosenTerm === candidateCorrectAnswer(currentCandidate);
    setFeedback(correct ? "correct" : "incorrect");
    if (correct) setScore((current) => current + 1);
    setAttempts((current) => [...current, { term: currentCandidate.term, chosenTerm, correct }]);
  }

  function chooseFutureMeaning(candidate: Candidate, senseId: string) {
    if (typeof window !== "undefined") {
      writeSensePreference(window.localStorage, candidate.term, senseId);
    }

    const previousAttempt = attempts.find(({ term }) => term === candidate.term);
    if (previousAttempt?.correct) {
      setScore((current) => Math.max(0, current - 1));
    }

    setAttempts((current) =>
      current.map((attempt) =>
        attempt.term === candidate.term ? { ...attempt, voided: true } : attempt,
      ),
    );
    setMeaningCorrectionTerm(undefined);
    setMeaningCorrectionStatus(
      `Thanks — we will use the new meaning for ${candidate.term} next time.`,
    );
  }

  function nextQuestion() {
    if (questionIndex + 1 >= trainingCandidates.length) {
      setSessionComplete(true);
      return;
    }
    goToQuestion(questionIndex + 1);
  }

  function goToQuestion(index: number) {
    const candidate = trainingCandidates[index];
    if (!candidate) return;
    const previousAttempt = attempts.find(({ term }) => term === candidate.term);
    setQuestionIndex(index);
    setChosenTerm(previousAttempt?.chosenTerm);
    setFeedback(previousAttempt ? (previousAttempt.correct ? "correct" : "incorrect") : undefined);
    setMeaningCorrectionTerm(undefined);
    setMeaningCorrectionStatus(undefined);
  }

  function resetSession() {
    setReviewing(false);
    setTraining(false);
    setQuestionIndex(0);
    setChosenTerm(undefined);
    setFeedback(undefined);
    setScore(0);
    setAttempts([]);
    setSessionComplete(false);
    setExpandedMeanings(new Set());
    setSelectedSenseIds({});
    setConfirmedMeanings(new Set());
    setDraftId(undefined);
    setDraftExpiresAt(undefined);
    setStudySessionId(undefined);
    setMeaningCorrectionTerm(undefined);
    setMeaningCorrectionStatus(undefined);
  }

  function confirmSense(candidate: Candidate) {
    const senseId = selectedSenseIds[candidate.term];
    if (!senseId) return;
    setCandidates((current) =>
      current.map((item) =>
        item.term === candidate.term ? resolveCandidateSense(item, senseId) : item,
      ),
    );
    setExpandedMeanings((current) => {
      const next = new Set(current);
      next.delete(candidate.term);
      return next;
    });
    setConfirmedMeanings((current) => new Set(current).add(candidate.term));
  }

  const scorableAttempts = attempts.filter(({ voided }) => !voided);
  const percentage =
    scorableAttempts.length === 0 ? 0 : Math.round((score / scorableAttempts.length) * 100);

  return (
    <main id="main-content" className="app-shell">
      <header className="topbar">
        <a className="brand" href="#main-content" aria-label="Lexi home">
          <span aria-hidden="true">L</span> Lexi
        </a>
        <p className="level-chip">English · A2–C2</p>
      </header>
      <div className="workspace">
        <section className="intro" aria-labelledby="capture-title">
          <p className="eyebrow">Your vocabulary, made useful</p>
          <h1 id="capture-title">Turn your world into English practice.</h1>
          <p>
            Bring words, a topic, or a photo. Review every suggestion before it becomes part of your
            training.
          </p>
        </section>

        {!reviewing ? (
          <section className="capture-card" aria-labelledby="mode-title">
            <div className="step">
              <span>1</span>
              <p>Choose your source</p>
            </div>
            <h2 id="mode-title">What do you want to learn from?</h2>
            <div className="mode-grid" role="group" aria-label="Vocabulary source">
              {(Object.keys(modeCopy) as Mode[]).map((value) => (
                <button
                  key={value}
                  type="button"
                  className="mode-button"
                  aria-pressed={mode === value}
                  onClick={() => {
                    setMode(value);
                  }}
                >
                  <span className="mode-icon" aria-hidden="true">
                    {value === "words" ? "Aa" : value === "topic" ? "#" : "▣"}
                  </span>
                  <strong>
                    {value === "words" ? "Words" : value === "topic" ? "Topic" : "Photo"}
                  </strong>
                </button>
              ))}
            </div>
            <form
              onSubmit={(event) => {
                void submit(event);
              }}
              className="capture-form"
            >
              <div className="form-heading">
                <h3>{modeCopy[mode].title}</h3>
                <p>{modeCopy[mode].description}</p>
              </div>
              {mode === "words" && (
                <label>
                  Words or phrases
                  <textarea required name="words" rows={4} placeholder="goleiro, chute, campo" />
                </label>
              )}
              {mode === "topic" && (
                <div className="form-row">
                  <label>
                    Topic
                    <input required name="topic" defaultValue="Football" maxLength={200} />
                  </label>
                  <label>
                    Number of words
                    <input required name="count" type="number" min={4} max={50} defaultValue={30} />
                  </label>
                </div>
              )}
              {mode === "photo" && (
                <>
                  <label>
                    Photo
                    <input
                      required
                      name="photo"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                    />
                  </label>
                  <label className="consent">
                    <input required type="checkbox" /> I agree to temporary photo processing. The
                    original is deleted after analysis.
                  </label>
                </>
              )}
              <label>
                English level
                <select name="level" defaultValue="B1">
                  <option>A2</option>
                  <option>B1</option>
                  <option>B2</option>
                  <option>C1</option>
                  <option>C2</option>
                </select>
              </label>
              {error && (
                <p role="alert" className="error-message">
                  {error}
                </p>
              )}
              <button className="primary-action" type="submit" disabled={loading}>
                {loading ? "Generating locally…" : "Create my word set"}{" "}
                <span aria-hidden="true">→</span>
              </button>
            </form>
          </section>
        ) : !training ? (
          <section className="capture-card review-card" aria-labelledby="review-title">
            <div className="step">
              <span>2</span>
              <p>Review suggestions</p>
            </div>
            <div className="review-heading">
              <div>
                <h2 id="review-title">{title}</h2>
                <p>Edit or remove anything before training.</p>
              </div>
              <span className="selection-count" role="status">
                {selected.size} selected
              </span>
            </div>
            <ul className="candidate-list">
              {candidates.map((candidate) => {
                const compatibleSenses = compatibleLexicalSenses(candidate);
                const needsConfirmation = requiresSenseConfirmation(candidate);
                const expanded = expandedMeanings.has(candidate.term);
                return (
                  <li key={candidate.term} className="candidate">
                    <label className="candidate-selection">
                      <input
                        type="checkbox"
                        checked={selected.has(candidate.term)}
                        onChange={() => {
                          toggle(candidate.term);
                        }}
                      />
                      <span>
                        <strong>{candidate.term}</strong>
                        <small>{candidate.type}</small>
                      </span>
                    </label>
                    <button
                      type="button"
                      className="audio-button"
                      aria-label={`Listen to ${candidate.term}`}
                      onClick={() => {
                        speak(candidate.term);
                      }}
                    >
                      🔊
                    </button>
                    <button
                      type="button"
                      className="text-button"
                      aria-label={`Edit ${candidate.term}`}
                    >
                      Edit
                    </button>
                    {needsConfirmation && (
                      <button
                        type="button"
                        className="text-button confirm-meaning-button"
                        aria-expanded={expanded}
                        aria-controls={`meaning-options-${candidate.term}`}
                        onClick={() => {
                          setExpandedMeanings((current) => {
                            const next = new Set(current);
                            if (next.has(candidate.term)) next.delete(candidate.term);
                            else next.add(candidate.term);
                            return next;
                          });
                        }}
                      >
                        Confirm meaning for {candidate.term}
                      </button>
                    )}
                    {confirmedMeanings.has(candidate.term) && (
                      <span className="meaning-confirmed" role="status">
                        Meaning confirmed
                      </span>
                    )}
                    {needsConfirmation && expanded && (
                      <fieldset
                        className="meaning-options"
                        id={`meaning-options-${candidate.term}`}
                      >
                        <legend>Which meaning matches your intended context?</legend>
                        {compatibleSenses.map((sense) => (
                          <label key={sense.senseId}>
                            <input
                              type="radio"
                              name={`sense-${candidate.term}`}
                              checked={selectedSenseIds[candidate.term] === sense.senseId}
                              onChange={() => {
                                setSelectedSenseIds((current) => ({
                                  ...current,
                                  [candidate.term]: sense.senseId,
                                }));
                              }}
                            />
                            <span>{sense.definition}</span>
                          </label>
                        ))}
                        <button
                          type="button"
                          className="secondary-action"
                          disabled={!selectedSenseIds[candidate.term]}
                          onClick={() => {
                            confirmSense(candidate);
                          }}
                        >
                          Use selected meaning for {candidate.term}
                        </button>
                      </fieldset>
                    )}
                  </li>
                );
              })}
            </ul>
            <div className="review-actions">
              <button
                type="button"
                className="secondary-action"
                onClick={() => {
                  setReviewing(false);
                }}
              >
                Back
              </button>
              <button
                type="button"
                className="primary-action"
                disabled={
                  selected.size < 4 || unresolvedSelectedCount > 0 || creatingSession || !draftId
                }
                onClick={() => {
                  void createStudySession();
                }}
              >
                {creatingSession ? "Creating study session…" : "I’m ready — start training"}{" "}
                <span aria-hidden="true">→</span>
              </button>
            </div>
            {error && (
              <p role="alert" className="error-message">
                {error}
              </p>
            )}
            {draftExpiresAt && (
              <p className="privacy-note">
                Secure draft available until {new Date(draftExpiresAt).toLocaleTimeString()}.
              </p>
            )}
            {selected.size < 4 && (
              <p className="privacy-note" role="status">
                Select at least 4 words so each question can have four useful alternatives.
              </p>
            )}
            {unresolvedSelectedCount > 0 && (
              <p className="privacy-note" role="status">
                Confirm the meaning of {unresolvedSelectedCount} selected ambiguous{" "}
                {unresolvedSelectedCount === 1 ? "word" : "words"} before training.
              </p>
            )}
            <p className="privacy-note">
              Nothing is added silently. You control every word in this collection.
            </p>
          </section>
        ) : (
          <section className="capture-card training-card" aria-labelledby="training-title">
            <div className="step">
              <span>3</span>
              <p>Retrieve in context</p>
            </div>
            {!sessionComplete && currentCandidate ? (
              <div className="training-panel">
                {studySessionId && (
                  <p className="privacy-note">Study session {studySessionId} created securely.</p>
                )}
                <p className="progress-label">
                  Question {questionIndex + 1} of {trainingCandidates.length}
                </p>
                <h2 id="training-title">
                  {currentCandidate.exerciseKind === "definition-choice"
                    ? "Which word matches the verified meaning?"
                    : "Which word completes the sentence?"}
                </h2>
                <PracticeImage candidate={currentCandidate} level={level} />
                <div className="sentence-with-audio">
                  <blockquote>“{sentenceWithGap(currentCandidate)}”</blockquote>
                  <button
                    type="button"
                    className="audio-button large"
                    aria-label="Listen to the sentence"
                    onClick={() => {
                      speakSentenceWithGap(sentenceWithGap(currentCandidate));
                    }}
                  >
                    🔊
                  </button>
                </div>
                <fieldset className="answer-options" disabled={Boolean(feedback)}>
                  <legend>Choose one answer</legend>
                  {answerOptions.map((term, index) => (
                    <div
                      key={term}
                      className={`answer-option${chosenTerm === term ? " selected" : ""}`}
                    >
                      <label>
                        <input
                          type="radio"
                          name="answer"
                          value={term}
                          checked={chosenTerm === term}
                          onChange={() => {
                            setChosenTerm(term);
                          }}
                        />
                        <span aria-hidden="true">{String.fromCharCode(65 + index)}</span>
                        <strong>{term}</strong>
                      </label>
                      <button
                        type="button"
                        className="audio-button"
                        aria-label={`Listen to ${term}`}
                        onClick={() => {
                          speak(term);
                        }}
                      >
                        🔊
                      </button>
                    </div>
                  ))}
                </fieldset>
                {!feedback ? (
                  <div className="question-navigation">
                    {questionIndex > 0 && (
                      <button
                        className="secondary-action"
                        type="button"
                        onClick={() => {
                          goToQuestion(questionIndex - 1);
                        }}
                      >
                        ← Previous question
                      </button>
                    )}
                    <button
                      className="primary-action"
                      type="button"
                      disabled={!chosenTerm}
                      onClick={checkAnswer}
                    >
                      Check my answer <span aria-hidden="true">→</span>
                    </button>
                  </div>
                ) : (
                  <div className={`answer-feedback ${feedback}`} role="status" aria-live="polite">
                    <p className="eyebrow">
                      {feedback === "correct" ? "Correct!" : "Not quite — keep going."}
                    </p>
                    <h3>The answer is “{currentCandidate.term}”.</h3>
                    <p className="speakable-line">
                      {currentCandidate.meaning}
                      <button
                        type="button"
                        className="audio-button"
                        aria-label="Listen to the meaning"
                        onClick={() => {
                          speak(currentCandidate.meaning);
                        }}
                      >
                        🔊
                      </button>
                    </p>
                    {compatibleLexicalSenses(currentCandidate).length > 1 && (
                      <div className="meaning-correction">
                        <button
                          type="button"
                          className="text-button"
                          aria-expanded={meaningCorrectionTerm === currentCandidate.term}
                          onClick={() => {
                            setMeaningCorrectionTerm((current) =>
                              current === currentCandidate.term ? undefined : currentCandidate.term,
                            );
                            setMeaningCorrectionStatus(undefined);
                          }}
                        >
                          Wrong meaning?
                        </button>
                        {meaningCorrectionTerm === currentCandidate.term && (
                          <fieldset className="meaning-options">
                            <legend>Which meaning did you intend?</legend>
                            {compatibleLexicalSenses(currentCandidate)
                              .filter(({ senseId }) => senseId !== currentCandidate.senseId)
                              .map((sense) => (
                                <button
                                  key={sense.senseId}
                                  type="button"
                                  className="secondary-action"
                                  onClick={() => {
                                    chooseFutureMeaning(currentCandidate, sense.senseId);
                                  }}
                                >
                                  {sense.definition}
                                </button>
                              ))}
                            <small>
                              This question will not count toward your score. The current session
                              will stay unchanged.
                            </small>
                          </fieldset>
                        )}
                        {meaningCorrectionStatus && (
                          <p className="meaning-confirmed" role="status">
                            {meaningCorrectionStatus}
                          </p>
                        )}
                      </div>
                    )}
                    <p>
                      <strong>Complete sentence:</strong> {currentCandidate.example}
                      <button
                        type="button"
                        className="audio-button"
                        aria-label="Listen to the complete sentence"
                        onClick={() => {
                          speak(currentCandidate.example);
                        }}
                      >
                        🔊
                      </button>
                    </p>
                    <div className="question-navigation">
                      {questionIndex > 0 && (
                        <button
                          className="secondary-action"
                          type="button"
                          onClick={() => {
                            goToQuestion(questionIndex - 1);
                          }}
                        >
                          ← Previous question
                        </button>
                      )}
                      <button className="primary-action" type="button" onClick={nextQuestion}>
                        {questionIndex + 1 === trainingCandidates.length
                          ? "Finish session"
                          : "Next question"}{" "}
                        <span aria-hidden="true">→</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="training-panel result-panel" role="status" aria-live="polite">
                <p className="result-mark" aria-hidden="true">
                  ✓
                </p>
                <p className="eyebrow">Session complete</p>
                <h2 id="training-title">{percentage}% correct</h2>
                <p>
                  You answered {score} of {scorableAttempts.length} scored questions correctly.
                  Meaning corrections were excluded. Open any word below to review it.
                </p>
                <div className="result-breakdown">
                  {attempts.map((attempt) => {
                    const candidate = trainingCandidates.find(({ term }) => term === attempt.term);
                    if (!candidate) return null;
                    return (
                      <details key={attempt.term} className={attempt.correct ? "correct" : "wrong"}>
                        <summary>
                          <span aria-hidden="true">{attempt.correct ? "✓" : "×"}</span>
                          <strong>{candidate.term}</strong>
                          <span>
                            {attempt.voided
                              ? "Meaning changed"
                              : attempt.correct
                                ? "Correct"
                                : `You chose: ${attempt.chosenTerm}`}
                          </span>
                        </summary>
                        <div>
                          <p className="speakable-line">
                            {candidate.meaning}
                            <button
                              type="button"
                              className="audio-button"
                              aria-label={`Listen to meaning for ${candidate.term}`}
                              onClick={() => {
                                speak(candidate.meaning);
                              }}
                            >
                              🔊
                            </button>
                          </p>
                          <div className="context-variations">
                            <strong>Three contexts</strong>
                            <ol>
                              {(candidate.contexts ?? [candidate.example]).map((context) => (
                                <li key={context}>
                                  <span>{context}</span>
                                  <button
                                    type="button"
                                    className="audio-button"
                                    aria-label={`Listen to context: ${context}`}
                                    onClick={() => {
                                      speak(context);
                                    }}
                                  >
                                    🔊
                                  </button>
                                </li>
                              ))}
                            </ol>
                          </div>
                          <button
                            type="button"
                            className="secondary-action"
                            onClick={() => {
                              speak(`${candidate.term}. ${candidate.example}`);
                            }}
                          >
                            🔊 Listen to word and example
                          </button>
                        </div>
                      </details>
                    );
                  })}
                </div>
                <button className="primary-action" type="button" onClick={resetSession}>
                  Create another word set
                </button>
                <p className="privacy-note">
                  This result describes this attempt only. Mastery develops across future practice.
                </p>
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
