import type { SessionIdentity, SessionIdentityPort } from "@vocabulary/auth";
import type {
  OwnedStudySessionApplication,
  StudySessionSnapshot,
} from "@vocabulary/domain-vocabulary";
import { NextResponse } from "next/server";

export interface SubmitStudySessionAnswerRequest {
  readonly exerciseId: string;
  readonly selectedOption: string;
}

export interface StudySessionAnswerResponse {
  readonly sessionId: string;
  readonly exerciseId: string;
  readonly selectedOption: string;
  readonly correct: boolean;
  readonly correctAnswer: string;
}

interface RouteContext {
  readonly params: Promise<{ readonly id: string }>;
}

export interface StudySessionAnswerDependencies {
  readonly identity: SessionIdentityPort<Headers>;
  readonly application: OwnedStudySessionApplication;
}

function errorResponse(status: number, code: string, message: string): NextResponse {
  return NextResponse.json({ code, message }, { status });
}

function authenticatedLearner(
  identity: SessionIdentity,
):
  | { readonly ok: true; readonly subjectId: string }
  | { readonly ok: false; readonly response: NextResponse } {
  if (identity.kind === "anonymous") {
    return {
      ok: false,
      response: errorResponse(401, "AUTHENTICATION_REQUIRED", "Authentication is required"),
    };
  }

  if (identity.audience !== "learner") {
    return {
      ok: false,
      response: errorResponse(403, "LEARNER_ACCESS_REQUIRED", "Learner access is required"),
    };
  }

  return { ok: true, subjectId: identity.subjectId };
}

function isAnswerRequest(value: unknown): value is SubmitStudySessionAnswerRequest {
  if (value === null || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.exerciseId === "string" &&
    candidate.exerciseId.trim().length > 0 &&
    typeof candidate.selectedOption === "string" &&
    candidate.selectedOption.trim().length > 0
  );
}

function findExercise(
  snapshot: StudySessionSnapshot,
  exerciseId: string,
): StudySessionSnapshot["exercises"][number] | undefined {
  return snapshot.exercises.find((exercise) => exercise.exerciseId === exerciseId);
}

export function createStudySessionAnswerHandler({
  identity,
  application,
}: StudySessionAnswerDependencies): (
  request: Request,
  context: RouteContext,
) => Promise<NextResponse> {
  return async (request, context) => {
    const learner = authenticatedLearner(await identity.resolve(request.headers));
    if (!learner.ok) return learner.response;

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return errorResponse(400, "INVALID_REQUEST", "Request body must be valid JSON");
    }

    if (!isAnswerRequest(body)) {
      return errorResponse(400, "INVALID_REQUEST", "Study session answer is invalid");
    }

    const { id } = await context.params;
    const session = await application.get(learner.subjectId, id);

    if (!session.ok) {
      return errorResponse(404, session.code, session.message);
    }

    const exercise = findExercise(session.snapshot, body.exerciseId.trim());
    if (exercise === undefined) {
      return errorResponse(
        404,
        "STUDY_SESSION_EXERCISE_NOT_FOUND",
        "Study session exercise was not found",
      );
    }

    const selectedOption = body.selectedOption.normalize("NFKC").trim();

    if (!exercise.options.includes(selectedOption)) {
      return errorResponse(
        400,
        "INVALID_STUDY_SESSION_OPTION",
        "Selected option is not available for this exercise",
      );
    }

    const response: StudySessionAnswerResponse = Object.freeze({
      sessionId: session.snapshot.sessionId,
      exerciseId: exercise.exerciseId,
      selectedOption,
      correct: selectedOption === exercise.answer,
      correctAnswer: exercise.answer,
    });

    return NextResponse.json(response);
  };
}
