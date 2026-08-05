import type { SessionIdentity, SessionIdentityPort } from "@vocabulary/auth";
import type { PersistentStudySessionDrafts } from "../../../../src/study-session-drafts";

interface RouteContext {
  readonly params: Promise<{ readonly id: string }>;
}

export interface DraftResolutionDependencies {
  readonly identity: SessionIdentityPort<Headers>;
  readonly drafts: PersistentStudySessionDrafts;
  readonly now?: () => Date;
  readonly createDraftId?: () => string;
  readonly draftLifetimeMs?: number;
}

function learnerIdentity(identity: SessionIdentity) {
  if (identity.kind === "anonymous") {
    return {
      ok: false as const,
      response: Response.json(
        { code: "AUTHENTICATION_REQUIRED", message: "Authentication is required" },
        { status: 401 },
      ),
    };
  }

  if (identity.audience !== "learner") {
    return {
      ok: false as const,
      response: Response.json(
        { code: "LEARNER_ACCESS_REQUIRED", message: "Learner access is required" },
        { status: 403 },
      ),
    };
  }

  return { ok: true as const, subjectId: identity.subjectId };
}

function parseSelections(value: unknown) {
  if (value === null || typeof value !== "object") return undefined;
  const values = (value as Record<string, unknown>).selections;
  if (!Array.isArray(values) || values.length === 0) return undefined;

  const selections: { candidateId: string; senseId: string }[] = [];
  for (const item of values) {
    if (item === null || typeof item !== "object") return undefined;
    const selection = item as Record<string, unknown>;
    if (
      typeof selection.candidateId !== "string" ||
      !selection.candidateId.trim() ||
      typeof selection.senseId !== "string" ||
      !selection.senseId.trim()
    ) {
      return undefined;
    }
    selections.push({
      candidateId: selection.candidateId,
      senseId: selection.senseId,
    });
  }
  return Object.freeze(selections);
}

export function createDraftResolutionHandler({
  identity,
  drafts,
  now = () => new Date(),
  createDraftId = () => `vocabulary-draft:${crypto.randomUUID()}`,
  draftLifetimeMs = 30 * 60 * 1000,
}: DraftResolutionDependencies) {
  return async (request: Request, context: RouteContext): Promise<Response> => {
    const learner = learnerIdentity(await identity.resolve(request.headers));
    if (!learner.ok) return learner.response;

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return Response.json({ code: "INVALID_REQUEST" }, { status: 400 });
    }

    const selections = parseSelections(body);
    if (!selections) {
      return Response.json({ code: "INVALID_REQUEST" }, { status: 400 });
    }

    const { id } = await context.params;
    const createdAt = now();
    const resolvedDraftId = createDraftId();
    const result = await drafts.resolveReview({
      subjectId: learner.subjectId,
      sourceDraftId: id,
      resolvedDraftId,
      expiresAt: new Date(createdAt.getTime() + draftLifetimeMs).toISOString(),
      selections,
    });

    if (!result.ok) {
      return Response.json(
        { code: result.code, message: result.message },
        { status: result.code === "draft-not-found" ? 404 : 400 },
      );
    }

    return Response.json({
      draftId: resolvedDraftId,
      expiresAt: result.expiresAt,
      publishedCandidateIds: result.publishedCandidateIds,
      omittedCandidateIds: result.omittedCandidateIds,
    });
  };
}
