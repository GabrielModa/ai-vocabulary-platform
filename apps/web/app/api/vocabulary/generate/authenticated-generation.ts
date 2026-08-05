import { localVocabularyRequestSchema } from "@vocabulary/ai";
import type { SessionIdentity, SessionIdentityPort } from "@vocabulary/auth";
import type { EnrichedVocabularySet } from "./lexical-enrichment";
import {
  serializeVocabularyGenerationResponse,
  type PublicVocabularyGenerationResponse,
} from "./response-contract";
import {
  GENERATION_DRAFT_VERSION,
  type PersistentStudySessionDrafts,
  type TrustedGenerationDraft,
} from "../../../../src/study-session-drafts";

export interface AuthenticatedVocabularyGenerationResponse {
  readonly generation: PublicVocabularyGenerationResponse;
  readonly draft: {
    readonly draftId: string;
    readonly expiresAt: string;
  };
}

export interface AuthenticatedVocabularyGenerationDependencies {
  readonly identity: SessionIdentityPort<Headers>;
  readonly drafts: PersistentStudySessionDrafts;
  readonly generate: (input: unknown) => Promise<EnrichedVocabularySet>;
  readonly now?: () => Date;
  readonly createDraftId?: () => string;
  readonly draftLifetimeMs?: number;
}

function learnerIdentity(
  identity: SessionIdentity,
):
  | { readonly ok: true; readonly subjectId: string }
  | { readonly ok: false; readonly response: Response } {
  if (identity.kind === "anonymous") {
    return {
      ok: false,
      response: Response.json(
        {
          code: "AUTHENTICATION_REQUIRED",
          message: "Authentication is required",
        },
        { status: 401 },
      ),
    };
  }

  if (identity.audience !== "learner") {
    return {
      ok: false,
      response: Response.json(
        {
          code: "LEARNER_ACCESS_REQUIRED",
          message: "Learner access is required",
        },
        { status: 403 },
      ),
    };
  }

  return { ok: true, subjectId: identity.subjectId };
}

function toTrustedDraft(
  generated: EnrichedVocabularySet,
  level: string,
  createdAt: string,
): TrustedGenerationDraft {
  return Object.freeze({
    version: GENERATION_DRAFT_VERSION,
    title: generated.title,
    level,
    createdAt,
    candidates: Object.freeze(
      generated.candidates.map((candidate) =>
        Object.freeze({
          candidateId: candidate.candidateId,
          outcome: candidate.exercisePipelineOutcome ?? {
            outcome: "reject" as const,
          },
        }),
      ),
    ),
  });
}

export function createAuthenticatedVocabularyGenerationHandler({
  identity,
  drafts,
  generate,
  now = () => new Date(),
  createDraftId = () => `vocabulary-draft:${crypto.randomUUID()}`,
  draftLifetimeMs = 30 * 60 * 1000,
}: AuthenticatedVocabularyGenerationDependencies): (request: Request) => Promise<Response> {
  return async (request) => {
    const learner = learnerIdentity(await identity.resolve(request.headers));
    if (!learner.ok) return learner.response;

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return Response.json({ code: "INVALID_REQUEST" }, { status: 400 });
    }

    const parsed = localVocabularyRequestSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ code: "INVALID_REQUEST" }, { status: 400 });
    }

    const generated = await generate(parsed.data);
    const createdAtDate = now();
    const createdAt = createdAtDate.toISOString();
    const expiresAt = new Date(createdAtDate.getTime() + draftLifetimeMs).toISOString();
    const draftId = createDraftId();

    const saved = await drafts.save({
      draftId,
      subjectId: learner.subjectId,
      expiresAt,
      draft: toTrustedDraft(generated, parsed.data.level, createdAt),
    });

    if (!saved.created) {
      return Response.json(
        {
          code: "GENERATION_DRAFT_CONFLICT",
          message: "Generation draft could not be created",
        },
        { status: 409 },
      );
    }

    const response: AuthenticatedVocabularyGenerationResponse = Object.freeze({
      generation: serializeVocabularyGenerationResponse(generated),
      draft: Object.freeze({ draftId, expiresAt }),
    });

    return Response.json(response);
  };
}
