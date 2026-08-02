"use client";

import { useState, type SyntheticEvent } from "react";

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
interface Candidate {
  readonly term: string;
  readonly meaning: string;
  readonly type: string;
  readonly example: string;
  readonly challenge: string;
  readonly contexts?: readonly string[];
}

interface Attempt {
  readonly term: string;
  readonly chosenTerm: string;
  readonly correct: boolean;
}

function formText(form: FormData, name: string): string {
  const value = form.get(name);
  return typeof value === "string" ? value : "";
}

function sentenceWithGap(candidate: Candidate): string {
  if (candidate.challenge.includes("___")) return candidate.challenge;
  const escapedTerm = candidate.term.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
  const termPattern = new RegExp(`\\b${escapedTerm}\\b`, "iu");
  return termPattern.test(candidate.example)
    ? candidate.example.replace(termPattern, "___")
    : `${candidate.challenge} ___`;
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
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
      const response = await fetch("/api/vocabulary/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ topic, requestedCount, level: formText(form, "level") }),
      });
      if (!response.ok) throw new Error("generation failed");
      const result = (await response.json()) as { title: string; candidates: Candidate[] };
      setCandidates(result.candidates);
      setTitle(result.title);
      setSelected(new Set(result.candidates.map(({ term }) => term)));
      setReviewing(true);
    } catch {
      setError("Local AI could not generate this set. Make sure Ollama is running and try again.");
    } finally {
      setLoading(false);
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
  const currentCandidate = trainingCandidates[questionIndex];
  const optionPool = currentCandidate
    ? [currentCandidate, ...trainingCandidates.filter(({ term }) => term !== currentCandidate.term)]
        .slice(0, 4)
        .map(({ term }) => term)
    : [];
  const optionOffset = optionPool.length === 0 ? 0 : questionIndex % optionPool.length;
  const answerOptions = [...optionPool.slice(optionOffset), ...optionPool.slice(0, optionOffset)];

  function checkAnswer() {
    if (!chosenTerm || !currentCandidate || feedback) return;
    const correct = chosenTerm === currentCandidate.term;
    setFeedback(correct ? "correct" : "incorrect");
    if (correct) setScore((current) => current + 1);
    setAttempts((current) => [...current, { term: currentCandidate.term, chosenTerm, correct }]);
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
  }

  const percentage =
    trainingCandidates.length === 0 ? 0 : Math.round((score / trainingCandidates.length) * 100);

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
              {candidates.map((candidate) => (
                <li key={candidate.term} className="candidate">
                  <label>
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
                </li>
              ))}
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
                disabled={selected.size < 4}
                onClick={() => {
                  setTraining(true);
                }}
              >
                I’m ready — start training <span aria-hidden="true">→</span>
              </button>
            </div>
            {selected.size < 4 && (
              <p className="privacy-note" role="status">
                Select at least 4 words so each question can have four useful alternatives.
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
                <p className="progress-label">
                  Question {questionIndex + 1} of {trainingCandidates.length}
                </p>
                <h2 id="training-title">Which word completes the sentence?</h2>
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
                  You answered {score} of {trainingCandidates.length} correctly. Open any word below
                  to review it.
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
                            {attempt.correct ? "Correct" : `You chose: ${attempt.chosenTerm}`}
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
