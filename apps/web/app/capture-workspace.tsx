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
import { readVisualCluesEnabled, writeVisualCluesEnabled } from "./visual-clue-preferences";
import {
  clearInterruptedStudySession,
  readInterruptedStudySession,
  saveInterruptedStudySession,
  type InterruptedStudySession,
  type ResumableCandidate,
} from "./interrupted-study-session";
import {
  appendCompletedStudySession,
  readCompletedStudySessions,
  type CompletedStudySession,
} from "./local-study-history";
import { planLocalAdaptiveReview } from "./adaptive-local-review";
import { summarizeLocalLearningProgress } from "./learning-progress-summary";
import { buildVerifiedErrorFeedback } from "./verified-error-feedback";

type Mode = "words" | "topic" | "photo";
type ReviewMode = "test" | "study";
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
    readonly learningReadiness?: LearningReadiness;
  };
  readonly draft: {
    readonly draftId: string;
    readonly expiresAt: string;
  };
}

interface LearningReadiness {
  readonly status: "ready" | "partial" | "blocked";
  readonly score: number;
  readonly requestedCount: number;
  readonly sessionReadyCount: number;
  readonly contextualExampleCount: number;
  readonly provisionalExampleCount: number;
  readonly recommendations: readonly string[];
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

function SpeakerIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" width="22" height="22" fill="none">
      <path d="M4 9v6h4l5 4V5L8 9H4Z" fill="currentColor" />
      <path
        d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function resumableLevel(level: string): InterruptedStudySession["level"] | undefined {
  return level === "A2" || level === "B1" || level === "B2" || level === "C1" || level === "C2"
    ? level
    : undefined;
}

function resumableCandidate(candidate: Candidate): ResumableCandidate {
  return {
    term: candidate.term,
    meaning: candidate.meaning,
    type: candidate.type,
    example: candidate.example,
    challenge: candidate.challenge,
    ...(candidate.candidateId ? { candidateId: candidate.candidateId } : {}),
    ...(candidate.senseId ? { senseId: candidate.senseId } : {}),
    ...(candidate.contexts ? { contexts: candidate.contexts } : {}),
    ...(candidate.exerciseKind ? { exerciseKind: candidate.exerciseKind } : {}),
    ...(candidate.exercisePipelineOutcome?.outcome === "publish"
      ? { exercisePipelineOutcome: candidate.exercisePipelineOutcome }
      : {}),
  };
}

async function enqueueImage(candidate: Candidate, level: string): Promise<ImageJob | undefined> {
  const context = `${candidate.meaning}. Example scene: ${candidate.example}`;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const response = await fetch("/api/vocabulary/image", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          term: candidate.term,
          meaning: candidate.meaning,
          context,
          level,
        }),
      });
      if (response.ok) return (await response.json()) as ImageJob;
    } catch {
      // A visual clue is optional. Retry once, then preserve the learning flow.
    }
  }

  return undefined;
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

function normalizedAnswer(value: string): string {
  return value.normalize("NFKC").toLocaleLowerCase("en-US").replace(/\s+/gu, " ").trim();
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
  const [reviewMode, setReviewMode] = useState<ReviewMode>("test");
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
  const [loading, setLoading] = useState(false);
  const [creatingSession, setCreatingSession] = useState(false);
  const [error, setError] = useState<string>();
  const [generationShortfall, setGenerationShortfall] = useState<{
    readonly requested: number;
    readonly delivered: number;
  }>();
  const [learningReadiness, setLearningReadiness] = useState<LearningReadiness>();
  const [level, setLevel] = useState("B1");
  const [draftId, setDraftId] = useState<string>();
  const [draftExpiresAt, setDraftExpiresAt] = useState<string>();
  const [studySessionId, setStudySessionId] = useState<string>();
  const [meaningCorrectionTerm, setMeaningCorrectionTerm] = useState<string>();
  const [meaningCorrectionStatus, setMeaningCorrectionStatus] = useState<string>();
  const [visualCluesEnabled, setVisualCluesEnabled] = useState(true);
  const [restorableSession, setRestorableSession] = useState<InterruptedStudySession>();
  const [restoredSession, setRestoredSession] = useState(false);
  const [completedSessions, setCompletedSessions] = useState<readonly CompletedStudySession[]>([]);
  const adaptiveReviewPlan = planLocalAdaptiveReview(
    completedSessions,
    new Date().toISOString(),
    10,
  );
  const learningProgress = summarizeLocalLearningProgress(
    completedSessions,
    new Date().toISOString(),
  );
  useEffect(() => {
    setVisualCluesEnabled(readVisualCluesEnabled(window.localStorage));
    setRestorableSession(readInterruptedStudySession(window.localStorage));
    setCompletedSessions(readCompletedStudySessions(window.localStorage));
  }, []);
  useEffect(() => {
    if (sessionComplete) {
      clearInterruptedStudySession(window.localStorage);
      return;
    }
    const safeLevel = resumableLevel(level);
    if (!training || !safeLevel || candidates.length === 0 || selected.size === 0) return;
    saveInterruptedStudySession(window.localStorage, {
      version: 1,
      savedAt: new Date().toISOString(),
      title,
      level: safeLevel,
      candidates: candidates.map(resumableCandidate),
      selectedTerms: [...selected],
      questionIndex,
      attempts,
      ...(chosenTerm ? { chosenTerm } : {}),
      ...(feedback ? { feedback } : {}),
    });
  }, [
    attempts,
    candidates,
    chosenTerm,
    feedback,
    level,
    questionIndex,
    selected,
    sessionComplete,
    title,
    training,
  ]);
  function updateVisualClues(enabled: boolean) {
    setVisualCluesEnabled(enabled);
    writeVisualCluesEnabled(window.localStorage, enabled);
  }
  async function submit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setLoading(true);
    setError(undefined);
    try {
      const requestedLevel = formText(form, "level");
      let topic: string;
      let requestedCount: number;
      if (mode === "photo") {
        const photoResponse = await fetch("/api/vocabulary/photo", {
          method: "POST",
          body: form,
        });
        if (!photoResponse.ok) throw new Error("photo analysis failed");
        const photoResult = (await photoResponse.json()) as { readonly terms: readonly string[] };
        topic = photoResult.terms.join(", ");
        requestedCount = Math.max(4, photoResult.terms.length);
      } else {
        topic = mode === "topic" ? formText(form, "topic") : formText(form, "words");
        requestedCount =
          mode === "topic"
            ? Number(form.get("count"))
            : Math.max(4, topic.split(/[,;\n]+/u).filter(Boolean).length);
      }
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
      setLearningReadiness(result.generation.learningReadiness);
      setGenerationShortfall(
        preferredCandidates.length < requestedCount
          ? { requested: requestedCount, delivered: preferredCandidates.length }
          : undefined,
      );
      setTitle(result.generation.title);
      setDraftId(result.draft.draftId);
      setDraftExpiresAt(result.draft.expiresAt);
      setStudySessionId(undefined);
      setSelected(new Set(preferredCandidates.map(({ term }) => term)));
      setExpandedMeanings(new Set());
      setSelectedSenseIds({});
      setLevel(requestedLevel);
      setReviewing(true);
      setReviewMode("test");
      clearInterruptedStudySession(window.localStorage);
      setRestorableSession(undefined);
      setRestoredSession(false);
      if (visualCluesEnabled) {
        for (const candidate of preferredCandidates
          .filter((item) => !requiresSenseConfirmation(item))
          .slice(0, 4))
          void enqueueImage(candidate, requestedLevel);
      }
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
        const failure = (await resolution.json().catch(() => undefined)) as
          { readonly code?: string } | undefined;
        if (resolution.status === 401) {
          setError("Sign in again before resolving this generated set.");
        } else if (resolution.status === 404) {
          setError("This generated set expired. Generate a new set to continue.");
        } else if (failure?.code === "invalid-selection") {
          setError(
            "One or more selected meanings changed. Review the selected words and try again.",
          );
        } else if (failure?.code === "no-published-exercises") {
          setError(
            "None of the selected words passed final exercise validation. Go back and generate replacements for this set.",
          );
        } else {
          setError(
            "Final exercise validation could not finish. Try again without regenerating the set.",
          );
        }
        return;
      }

      const resolved = (await resolution.json()) as {
        readonly draftId: string;
        readonly publishedCandidateIds: readonly string[];
        readonly omittedCandidateIds: readonly string[];
      };
      const published = new Set(resolved.publishedCandidateIds);
      const publishedCandidateIds = selectedCandidateIds.filter((candidateId) =>
        published.has(candidateId),
      );

      if (publishedCandidateIds.length === 0) {
        setError(
          "None of the selected words passed final exercise validation. Go back and generate replacements for this set.",
        );
        return;
      }

      if (publishedCandidateIds.length < 4) {
        const omitted = new Set(resolved.omittedCandidateIds);
        const omittedTerms = candidates
          .filter((candidate) => omitted.has(candidate.candidateId ?? ""))
          .map((candidate) => candidate.term);
        const omittedCopy =
          omittedTerms.length > 0 ? ` Could not publish: ${omittedTerms.join(", ")}.` : "";
        setError(
          `Only ${String(publishedCandidateIds.length)} words produced verified exercises.${omittedCopy} Generate replacements or select at least 4 publishable words.`,
        );
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
      const publishedIds = new Set(publishedCandidateIds);
      setSelected(
        new Set(
          candidates
            .filter(({ candidateId }) => candidateId && publishedIds.has(candidateId))
            .map(({ term }) => term),
        ),
      );
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
  const currentExerciseMode =
    title === "Adaptive review" && currentCandidate
      ? adaptiveReviewPlan?.items.find(({ candidate }) => candidate.term === currentCandidate.term)
          ?.exerciseProgression.selectedMode
      : undefined;
  const verifiedErrorFeedback =
    feedback === "incorrect" && currentCandidate && chosenTerm
      ? buildVerifiedErrorFeedback(currentCandidate, chosenTerm, candidates)
      : undefined;
  const optionPool = currentCandidate ? candidateAnswerOptions(currentCandidate, candidates) : [];
  const optionOffset = optionPool.length === 0 ? 0 : questionIndex % optionPool.length;
  const answerOptions = [...optionPool.slice(optionOffset), ...optionPool.slice(0, optionOffset)];

  function checkAnswer() {
    if (!chosenTerm || !currentCandidate || feedback) return;
    const correct =
      normalizedAnswer(chosenTerm) === normalizedAnswer(candidateCorrectAnswer(currentCandidate));
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
      const safeLevel = resumableLevel(level);
      if (safeLevel) {
        const sessionId = studySessionId ?? `local:${new Date().toISOString()}`;
        appendCompletedStudySession(window.localStorage, {
          version: 1,
          sessionId,
          completedAt: new Date().toISOString(),
          title,
          level: safeLevel,
          candidates: candidates.map(resumableCandidate),
          selectedTerms: [...selected],
          attempts,
          score: {
            correct: score,
            attempted: attempts.filter(({ voided }) => !voided).length,
            percentage:
              attempts.filter(({ voided }) => !voided).length === 0
                ? 0
                : Math.round((score / attempts.filter(({ voided }) => !voided).length) * 100),
          },
        });
        setCompletedSessions(readCompletedStudySessions(window.localStorage));
      }
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
    clearInterruptedStudySession(window.localStorage);
    setReviewing(false);
    setGenerationShortfall(undefined);
    setTraining(false);
    setQuestionIndex(0);
    setChosenTerm(undefined);
    setFeedback(undefined);
    setScore(0);
    setAttempts([]);
    setSessionComplete(false);
    setExpandedMeanings(new Set());
    setSelectedSenseIds({});
    setDraftId(undefined);
    setDraftExpiresAt(undefined);
    setStudySessionId(undefined);
    setMeaningCorrectionTerm(undefined);
    setMeaningCorrectionStatus(undefined);
    setRestorableSession(undefined);
    setRestoredSession(false);
  }

  function continueInterruptedSession(session: InterruptedStudySession) {
    const restoredAttempts: readonly Attempt[] = session.attempts;
    setTitle(session.title);
    setLevel(session.level);
    setCandidates(session.candidates);
    setSelected(new Set(session.selectedTerms));
    setQuestionIndex(session.questionIndex);
    setChosenTerm(session.chosenTerm);
    setFeedback(session.feedback);
    setAttempts(restoredAttempts);
    setScore(restoredAttempts.filter(({ correct, voided }) => correct && !voided).length);
    setSessionComplete(false);
    setReviewing(true);
    setTraining(true);
    setReviewMode("test");
    setRestorableSession(undefined);
    setRestoredSession(true);
    setStudySessionId(`local:${session.savedAt}`);
    setError(undefined);
  }

  function practiceWrongWords() {
    const wrongTerms = attempts
      .filter(({ correct, voided }) => !correct && !voided)
      .map(({ term }) => term);
    if (wrongTerms.length === 0) return;
    clearInterruptedStudySession(window.localStorage);
    setSelected(new Set(wrongTerms));
    setQuestionIndex(0);
    setChosenTerm(undefined);
    setFeedback(undefined);
    setScore(0);
    setAttempts([]);
    setSessionComplete(false);
    setStudySessionId(`retry:${crypto.randomUUID()}`);
    setMeaningCorrectionTerm(undefined);
    setMeaningCorrectionStatus(undefined);
    setRestoredSession(false);
  }

  function startAdaptiveReview() {
    if (!adaptiveReviewPlan) return;
    clearInterruptedStudySession(window.localStorage);
    const plannedTerms = adaptiveReviewPlan.items.map(({ candidate }) => candidate.term);
    setCandidates(adaptiveReviewPlan.candidatePool);
    setSelected(new Set(plannedTerms));
    setTitle("Adaptive review");
    setLevel(completedSessions[0]?.level ?? "B1");
    setQuestionIndex(0);
    setChosenTerm(undefined);
    setFeedback(undefined);
    setScore(0);
    setAttempts([]);
    setSessionComplete(false);
    setReviewing(true);
    setTraining(true);
    setStudySessionId(`adaptive:${crypto.randomUUID()}`);
    setMeaningCorrectionTerm(undefined);
    setMeaningCorrectionStatus(undefined);
    setRestorableSession(undefined);
    setRestoredSession(false);
    setError(undefined);
  }

  function discardInterruptedSession() {
    clearInterruptedStudySession(window.localStorage);
    setRestorableSession(undefined);
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
            {restorableSession && (
              <aside className="resume-session" aria-labelledby="resume-session-title">
                <div>
                  <p className="eyebrow">Saved on this device</p>
                  <h3 id="resume-session-title">Continue {restorableSession.title}?</h3>
                  <p>
                    Question {restorableSession.questionIndex + 1} of{" "}
                    {restorableSession.selectedTerms.length}. Saved progress expires after seven
                    days.
                  </p>
                </div>
                <div>
                  <button
                    type="button"
                    className="primary-action"
                    onClick={() => {
                      continueInterruptedSession(restorableSession);
                    }}
                  >
                    Continue session
                  </button>
                  <button
                    type="button"
                    className="secondary-action"
                    onClick={discardInterruptedSession}
                  >
                    Discard saved session
                  </button>
                </div>
              </aside>
            )}
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
                    <input required name="consent" value="true" type="checkbox" /> I agree to
                    temporary photo processing. The original is deleted after analysis.
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
              <label className="visual-clue-setting">
                <input
                  type="checkbox"
                  checked={visualCluesEnabled}
                  onChange={(event) => {
                    updateVisualClues(event.currentTarget.checked);
                  }}
                />
                <span>
                  <strong>Use visual clues</strong>
                  <small>Generate checked local images in the background during practice.</small>
                </span>
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
            {completedSessions.length > 0 && (
              <section className="recent-practice" aria-labelledby="recent-practice-title">
                <section className="learning-progress" aria-labelledby="learning-progress-title">
                  <div>
                    <p className="eyebrow">Calculated from retrieval history</p>
                    <h3 id="learning-progress-title">Learning progress</h3>
                    <p>
                      {learningProgress.retrievals.accuracyPercentage}% retrieval accuracy ·{" "}
                      {learningProgress.dueNow} due now
                    </p>
                  </div>
                  <dl aria-label="Knowledge states">
                    <div>
                      <dt>New</dt>
                      <dd>{learningProgress.states.new}</dd>
                    </div>
                    <div>
                      <dt>Learning</dt>
                      <dd>{learningProgress.states.learning}</dd>
                    </div>
                    <div>
                      <dt>Review</dt>
                      <dd>{learningProgress.states.review}</dd>
                    </div>
                    <div>
                      <dt>Mastered</dt>
                      <dd>{learningProgress.states.mastered}</dd>
                    </div>
                    <div>
                      <dt>Retrievals</dt>
                      <dd>
                        {learningProgress.retrievals.correct} of{" "}
                        {learningProgress.retrievals.attempted}
                      </dd>
                    </div>
                  </dl>
                  {learningProgress.priorityTerms.length > 0 && (
                    <p className="learning-priorities">
                      <strong>Priority now:</strong> {learningProgress.priorityTerms.join(", ")}
                    </p>
                  )}
                </section>
                <div>
                  <p className="eyebrow">Saved on this device</p>
                  <h3 id="recent-practice-title">Recent practice</h3>
                  <p>Attempt history only — mastery is calculated separately over time.</p>
                </div>
                {adaptiveReviewPlan && (
                  <div className="adaptive-review-callout">
                    <p>
                      {adaptiveReviewPlan.counts.due} due · {adaptiveReviewPlan.counts.new} new ·{" "}
                      {adaptiveReviewPlan.counts.early} early review
                    </p>
                    <button className="primary-action" type="button" onClick={startAdaptiveReview}>
                      Start adaptive review
                    </button>
                  </div>
                )}
                <ol>
                  {completedSessions.slice(0, 3).map((session) => (
                    <li key={session.sessionId}>
                      <span>
                        <strong>{session.title}</strong>
                        <small>
                          {session.level} · {new Date(session.completedAt).toLocaleDateString()}
                        </small>
                      </span>
                      <span>
                        {session.score.percentage}% · {session.score.correct} of{" "}
                        {session.score.attempted} correct
                      </span>
                    </li>
                  ))}
                </ol>
              </section>
            )}
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
            <div className="review-mode" role="group" aria-label="Review mode">
              <button
                type="button"
                aria-label="Test mode"
                aria-pressed={reviewMode === "test"}
                onClick={() => {
                  setReviewMode("test");
                }}
              >
                Test
                <small>Recall first; meanings stay hidden.</small>
              </button>
              <button
                type="button"
                aria-label="Study mode"
                aria-pressed={reviewMode === "study"}
                onClick={() => {
                  setReviewMode("study");
                }}
              >
                Study
                <small>Explore meaning, examples, and audio.</small>
              </button>
            </div>
            {generationShortfall && (
              <div className="adaptive-review-callout" aria-live="polite">
                <p>
                  {generationShortfall.delivered} of {generationShortfall.requested} useful words
                  are ready.
                </p>
                <small>Try a broader topic or request a smaller set.</small>
              </div>
            )}
            {learningReadiness && (
              <div className="adaptive-review-callout" aria-live="polite">
                <p>
                  Learning readiness: {learningReadiness.status}.{" "}
                  {learningReadiness.sessionReadyCount} of {learningReadiness.requestedCount} words
                  are eligible for final exercise publication.
                </p>
                <small>
                  Quality score {learningReadiness.score}/100 ·{" "}
                  {learningReadiness.contextualExampleCount} contextual examples
                  {learningReadiness.provisionalExampleCount > 0
                    ? ` · ${String(learningReadiness.provisionalExampleCount)} provisional`
                    : ""}
                  . {learningReadiness.recommendations[0] ?? "The set is ready for active recall."}
                </small>
              </div>
            )}
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
                      <SpeakerIcon />
                    </button>
                    {reviewMode === "study" && (
                      <div className="study-details">
                        <div>
                          <span>
                            <strong>Meaning</strong>
                            <span>{candidate.meaning}</span>
                          </span>
                          <button
                            type="button"
                            className="audio-button"
                            aria-label={`Listen to the meaning of ${candidate.term}`}
                            onClick={() => {
                              speak(candidate.meaning);
                            }}
                          >
                            <SpeakerIcon />
                          </button>
                        </div>
                        {[candidate.example, ...(candidate.contexts ?? [])]
                          .filter(
                            (context, index, contexts) =>
                              context.trim().length > 0 && contexts.indexOf(context) === index,
                          )
                          .map((context, index) => (
                            <div key={`${candidate.term}-context-${String(index)}`}>
                              <span>
                                <strong>
                                  {index === 0
                                    ? candidate.exampleProvenance?.generated
                                      ? "AI-generated example"
                                      : "Example"
                                    : `Context ${String(index + 1)}`}
                                </strong>
                                <span>{context}</span>
                              </span>
                              <button
                                type="button"
                                className="audio-button"
                                aria-label={
                                  index === 0
                                    ? `Listen to the example for ${candidate.term}`
                                    : `Listen to context ${String(index + 1)} for ${candidate.term}`
                                }
                                onClick={() => {
                                  speak(context);
                                }}
                              >
                                <SpeakerIcon />
                              </button>
                            </div>
                          ))}
                        {candidate.verifiedPronunciations
                          ?.filter(
                            (pronunciation) =>
                              pronunciation.dialect === "en-US" &&
                              pronunciation.notation === "ARPABET" &&
                              Boolean(pronunciation.transcription),
                          )
                          .map((pronunciation) => (
                            <p
                              key={`${candidate.term}-${pronunciation.transcription ?? "pronunciation"}`}
                              className="verified-pronunciation"
                            >
                              <strong>Verified US pronunciation · ARPABET</strong>
                              <span>{pronunciation.transcription}</span>
                            </p>
                          ))}
                      </div>
                    )}
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
                {studySessionId && <p className="privacy-note">Your study session is ready.</p>}
                {restoredSession && <p className="privacy-note">Restored from this device.</p>}
                <p className="progress-label">
                  Question {questionIndex + 1} of {trainingCandidates.length}
                </p>
                <h2 id="training-title">
                  {currentExerciseMode === "typed-recall"
                    ? "Type the word that completes the sentence"
                    : currentCandidate.exerciseKind === "definition-choice"
                      ? "Which word matches the verified meaning?"
                      : "Which word completes the sentence?"}
                </h2>
                <label className="visual-clue-setting compact">
                  <input
                    type="checkbox"
                    checked={visualCluesEnabled}
                    onChange={(event) => {
                      updateVisualClues(event.currentTarget.checked);
                    }}
                  />
                  <span>
                    <strong>Use visual clues</strong>
                    <small>Turn off to continue without waiting for local image generation.</small>
                  </span>
                </label>
                {visualCluesEnabled ? (
                  <PracticeImage candidate={currentCandidate} level={level} />
                ) : (
                  <p className="visual-clue-disabled" role="status">
                    Training without visual clues.
                  </p>
                )}
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
                    <SpeakerIcon />
                  </button>
                </div>
                {currentExerciseMode === "typed-recall" ? (
                  <div className="typed-recall-field">
                    <label htmlFor="typed-recall-answer">Type your answer</label>
                    <input
                      id="typed-recall-answer"
                      type="text"
                      autoComplete="off"
                      autoCapitalize="none"
                      maxLength={200}
                      spellCheck={false}
                      disabled={Boolean(feedback)}
                      value={chosenTerm ?? ""}
                      onChange={(event) => {
                        setChosenTerm(event.currentTarget.value);
                      }}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          checkAnswer();
                        }
                      }}
                    />
                    <small>No options this time — retrieve the word from memory.</small>
                  </div>
                ) : (
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
                          <SpeakerIcon />
                        </button>
                      </div>
                    ))}
                  </fieldset>
                )}
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
                    {verifiedErrorFeedback && (
                      <p className={`verified-error-feedback ${verifiedErrorFeedback.kind}`}>
                        <strong>Why:</strong> {verifiedErrorFeedback.message}
                      </p>
                    )}
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
                        <SpeakerIcon />
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
                        <SpeakerIcon />
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
                              <SpeakerIcon />
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
                                    <SpeakerIcon />
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
                            <SpeakerIcon /> Listen to word and example
                          </button>
                        </div>
                      </details>
                    );
                  })}
                </div>
                <div className="result-actions">
                  {attempts.some(({ correct, voided }) => !correct && !voided) && (
                    <button className="primary-action" type="button" onClick={practiceWrongWords}>
                      Practice wrong words
                    </button>
                  )}
                  <button className="secondary-action" type="button" onClick={resetSession}>
                    Create another word set
                  </button>
                </div>
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
