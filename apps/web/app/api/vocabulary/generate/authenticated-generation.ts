import { localVocabularyRequestSchema, type LocalVocabularyRequest } from "@vocabulary/ai";
import type { SessionIdentity, SessionIdentityPort } from "@vocabulary/auth";
import type { LearningCandidate } from "@vocabulary/domain-vocabulary";
import type { EnrichedCandidate, EnrichedVocabularySet } from "./lexical-enrichment";
import { evaluateLearningSetReadiness } from "./learning-set-readiness";
import {
  serializeVocabularyGenerationResponse,
  type PublicVocabularyGenerationResponse,
} from "./response-contract";
import {
  GENERATION_DRAFT_VERSION,
  type PersistentStudySessionDrafts,
  type TrustedGenerationDraft,
} from "../../../../src/study-session-drafts";
import { publishReviewedDefinitionChoices } from "../../../../src/reviewed-definition-choice-publication";

export interface AuthenticatedVocabularyGenerationResponse {
  readonly generation: PublicVocabularyGenerationResponse;
  readonly draft: {
    readonly draftId: string;
    readonly expiresAt: string;
  };
}

export interface AuthenticatedVocabularyGenerationDependencies {
  readonly identity: SessionIdentityPort<Headers>;
  readonly drafts: Pick<PersistentStudySessionDrafts, "save">;
  readonly generate: (input: unknown) => Promise<EnrichedVocabularySet>;
  readonly generateSupplemental?: (
    input: LocalVocabularyRequest,
    generated: EnrichedVocabularySet,
  ) => Promise<readonly EnrichedCandidate[]>;
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
  supplementalCandidates: readonly EnrichedCandidate[],
  level: string,
  createdAt: string,
): TrustedGenerationDraft {
  return Object.freeze({
    version: GENERATION_DRAFT_VERSION,
    title: generated.title,
    level,
    createdAt,
    sourceCandidates: Object.freeze([...generated.candidates, ...supplementalCandidates]),
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

function toPreviewCandidate(candidate: EnrichedCandidate): LearningCandidate | undefined {
  if (candidate.lexicalValidationStatus !== "verified" || candidate.senseId === undefined) {
    return undefined;
  }
  const selectedSense = candidate.lexicalSenses?.find(
    ({ senseId, partOfSpeech, definition }) =>
      senseId === candidate.senseId && partOfSpeech === candidate.type && Boolean(definition),
  );
  if (selectedSense?.definition === undefined) return undefined;

  return Object.freeze({
    candidateId: candidate.candidateId,
    displayForm: candidate.term,
    normalizedLemma: candidate.normalizedLemma,
    proposedPartOfSpeech: candidate.type,
    lexicalStatus: "verified" as const,
    selectedSense: Object.freeze({
      senseId: selectedSense.senseId,
      definition: selectedSense.definition,
      partOfSpeech: selectedSense.partOfSpeech,
      provenance: selectedSense.provenance,
      confirmedBy:
        candidate.lexicalSenses?.filter(
          ({ partOfSpeech, definition }) => partOfSpeech === candidate.type && Boolean(definition),
        ).length === 1
          ? ("unique-provider-match" as const)
          : ("deterministic-context-selection" as const),
    }),
    availableSenses: Object.freeze([...(candidate.lexicalSenses ?? [])]),
    selectionReasons: Object.freeze([...candidate.selectionReasons]),
  });
}

function withFinalPublicationReadiness(
  generated: EnrichedVocabularySet,
  supplementalCandidates: readonly EnrichedCandidate[],
  level: string,
): EnrichedVocabularySet {
  const candidates = generated.candidates.flatMap((candidate) => {
    const preview = toPreviewCandidate(candidate);
    return preview === undefined ? [] : [preview];
  });
  const publishableCandidateIds = new Set(
    generated.candidates
      .filter(({ exercisePipelineOutcome }) => exercisePipelineOutcome?.outcome === "publish")
      .map(({ candidateId }) => candidateId),
  );
  for (const { candidateId, outcome } of publishReviewedDefinitionChoices({
    candidates,
    sources: [...generated.candidates, ...supplementalCandidates],
    context: { topic: generated.title, learnerLevel: level, locale: "en-US" },
  })) {
    if (outcome.outcome === "publish") publishableCandidateIds.add(candidateId);
  }

  return Object.freeze({
    ...generated,
    learningReadiness: evaluateLearningSetReadiness({
      candidates: generated.candidates,
      fulfillment: generated.generationFulfillment,
      publishableCandidateIds,
    }),
  });
}

export function createAuthenticatedVocabularyGenerationHandler({
  identity,
  drafts,
  generate,
  generateSupplemental = () => Promise.resolve([]),
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
    const supplementalCandidates = await generateSupplemental(parsed.data, generated);
    const finalizedGeneration = withFinalPublicationReadiness(
      generated,
      supplementalCandidates,
      parsed.data.level,
    );
    const createdAtDate = now();
    const createdAt = createdAtDate.toISOString();
    const expiresAt = new Date(createdAtDate.getTime() + draftLifetimeMs).toISOString();
    const draftId = createDraftId();

    const saved = await drafts.save({
      draftId,
      subjectId: learner.subjectId,
      expiresAt,
      draft: toTrustedDraft(
        finalizedGeneration,
        supplementalCandidates,
        parsed.data.level,
        createdAt,
      ),
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
      generation: serializeVocabularyGenerationResponse(finalizedGeneration),
      draft: Object.freeze({ draftId, expiresAt }),
    });

    return Response.json(response);
  };
}
