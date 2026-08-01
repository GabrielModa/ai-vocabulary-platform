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
const preview = [
  { term: "pitch", meaning: "the surface where a football match is played", type: "noun" },
  { term: "pass", meaning: "to send the ball to another player", type: "verb" },
  {
    term: "close match",
    meaning: "a game in which the scores are nearly equal",
    type: "collocation",
  },
];

export function CaptureWorkspace() {
  const [mode, setMode] = useState<Mode>("topic");
  const [reviewing, setReviewing] = useState(false);
  const [training, setTraining] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [selected, setSelected] = useState(() => new Set(preview.map(({ term }) => term)));
  function submit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    setReviewing(true);
  }
  function toggle(term: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(term)) next.delete(term);
      else next.add(term);
      return next;
    });
  }

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
            <form onSubmit={submit} className="capture-form">
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
                    <input
                      required
                      name="count"
                      type="number"
                      min={1}
                      max={100}
                      defaultValue={30}
                    />
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
              <button className="primary-action" type="submit">
                Create my word set <span aria-hidden="true">→</span>
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
                <h2 id="review-title">Your football word set</h2>
                <p>Edit or remove anything before training.</p>
              </div>
              <span className="selection-count" role="status">
                {selected.size} selected
              </span>
            </div>
            <ul className="candidate-list">
              {preview.map((candidate) => (
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
                      <span>{candidate.meaning}</span>
                    </span>
                  </label>
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
                disabled={selected.size === 0}
                onClick={() => {
                  setTraining(true);
                }}
              >
                Confirm and start training <span aria-hidden="true">→</span>
              </button>
            </div>
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
            {!completed ? (
              <form
                className="training-panel"
                onSubmit={(event) => {
                  event.preventDefault();
                  setCompleted(true);
                }}
              >
                <p className="progress-label">Question 1 of {selected.size}</p>
                <h2 id="training-title">What word completes this football context?</h2>
                <blockquote>“The players walked onto the ___ before the match.”</blockquote>
                <label>
                  Your answer
                  <input required name="answer" autoComplete="off" autoFocus />
                </label>
                <button className="primary-action" type="submit">
                  Check my answer <span aria-hidden="true">→</span>
                </button>
              </form>
            ) : (
              <div className="training-panel result-panel" role="status" aria-live="polite">
                <p className="result-mark" aria-hidden="true">
                  ✓
                </p>
                <p className="eyebrow">Attempt recorded</p>
                <h2 id="training-title">The expected answer is “pitch”.</h2>
                <p>A pitch is the surface where a football match is played.</p>
                <button
                  className="primary-action"
                  type="button"
                  onClick={() => {
                    setReviewing(false);
                    setTraining(false);
                    setCompleted(false);
                  }}
                >
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
