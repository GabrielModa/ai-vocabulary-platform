import type { SessionIdentity, SessionIdentityPort } from "@vocabulary/auth";
import type {
  BuildStudySessionSnapshotInput,
  OwnedStudySessionApplication,
} from "@vocabulary/domain-vocabulary";
import { NextResponse } from "next/server";
import { serializeStudySession } from "./response-contract";

export interface CreateStudySessionRequest {
  readonly draftId: string;
  readonly title: string;
  readonly level: string;
  readonly selectedCandidateIds: readonly string[];
}

export type StudySessionDraftResolution =
  | {
      readonly ok: true;
      readonly input: BuildStudySessionSnapshotInput;
    }
  | {
      readonly ok: false;
      readonly code: "draft-not-found" | "invalid-selection";
      readonly message: string;
    };

export interface StudySessionDraftPort {
  resolve(
    subjectId: string,
    request: CreateStudySessionRequest,
  ): Promise<StudySessionDraftResolution>;
}

export interface StudySessionHttpDependencies {
  readonly identity: SessionIdentityPort<Headers>;
  readonly drafts: StudySessionDraftPort;
  readonly application: OwnedStudySessionApplication;
}

interface RouteContext {
  readonly params: Promise<{ readonly id: string }>;
}

function errorResponse(status: number, code: string, message: string): NextResponse {
  return NextResponse.json({ code, message }, { status });
}

function isCreateRequest(value: unknown): value is CreateStudySessionRequest {
  if (value === null || typeof value !== "object") return false;

  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.draftId === "string" &&
    typeof candidate.title === "string" &&
    typeof candidate.level === "string" &&
    Array.isArray(candidate.selectedCandidateIds) &&
    candidate.selectedCandidateIds.every((entry) => typeof entry === "string")
  );
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

export function createStudySessionHttpHandlers(dependencies: StudySessionHttpDependencies): {
  readonly POST: (request: Request) => Promise<NextResponse>;
  readonly GET: (request: Request, context: RouteContext) => Promise<NextResponse>;
} {
  return {
    async POST(request) {
      const learner = authenticatedLearner(await dependencies.identity.resolve(request.headers));
      if (!learner.ok) return learner.response;

      let body: unknown;
      try {
        body = await request.json();
      } catch {
        return errorResponse(400, "INVALID_REQUEST", "Request body must be valid JSON");
      }

      if (!isCreateRequest(body)) {
        return errorResponse(400, "INVALID_REQUEST", "Study session request is invalid");
      }

      const resolved = await dependencies.drafts.resolve(learner.subjectId, body);
      if (!resolved.ok) {
        return errorResponse(
          resolved.code === "draft-not-found" ? 404 : 400,
          resolved.code === "draft-not-found"
            ? "STUDY_SESSION_DRAFT_NOT_FOUND"
            : "INVALID_STUDY_SESSION_SELECTION",
          resolved.message,
        );
      }

      const result = await dependencies.application.create(learner.subjectId, resolved.input);

      if (!result.ok) {
        if (result.status === "invalid") {
          return errorResponse(400, result.code, result.message);
        }
        if (result.status === "conflict") {
          return errorResponse(409, result.code, result.message);
        }
        return errorResponse(503, result.code, result.message);
      }

      return NextResponse.json(serializeStudySession(result.snapshot), {
        status: result.status === "created" ? 201 : 200,
      });
    },

    async GET(request, context) {
      const learner = authenticatedLearner(await dependencies.identity.resolve(request.headers));
      if (!learner.ok) return learner.response;

      const { id } = await context.params;
      const result = await dependencies.application.get(learner.subjectId, id);

      if (!result.ok) {
        return errorResponse(404, result.code, result.message);
      }

      return NextResponse.json(serializeStudySession(result.snapshot));
    },
  };
}
