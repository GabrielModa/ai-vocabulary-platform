import type {
  BuildStudySessionSnapshotInput,
  PublishedExerciseSelection,
} from "@vocabulary/domain-vocabulary";
import type {
  GenerationDraftRecord,
  GenerationDraftRepository,
} from "@vocabulary/database/runtime";
import type { StudySessionDraftPort } from "../app/api/study-sessions/http";
import type { EnrichedCandidate } from "../app/api/vocabulary/generate/lexical-enrichment";
import { runCandidateExercisePipelines } from "../app/api/vocabulary/generate/pipeline-adapter";
import { publishReviewedDefinitionChoices } from "./reviewed-definition-choice-publication";
import type { LearningCandidate } from "@vocabulary/domain-vocabulary";

export const GENERATION_DRAFT_VERSION = "vocabulary-generation-draft-v1" as const;

export interface TrustedGenerationDraft {
  readonly version: typeof GENERATION_DRAFT_VERSION;
  readonly title: string;
  readonly level: string;
  readonly createdAt: string;
  readonly candidates: readonly PublishedExerciseSelection[];
  readonly sourceCandidates?: readonly EnrichedCandidate[];
}

export interface SaveTrustedGenerationDraftInput {
  readonly draftId: string;
  readonly subjectId: string;
  readonly expiresAt: string;
  readonly draft: TrustedGenerationDraft;
}

export interface ResolveTrustedDraftInput {
  readonly subjectId: string;
  readonly sourceDraftId: string;
  readonly resolvedDraftId: string;
  readonly expiresAt: string;
  readonly selections: readonly {
    readonly candidateId: string;
    readonly senseId: string;
  }[];
}

export type ResolveTrustedDraftResult =
  | {
      readonly ok: true;
      readonly expiresAt: string;
      readonly publishedCandidateIds: readonly string[];
      readonly omittedCandidateIds: readonly string[];
    }
  | {
      readonly ok: false;
      readonly code: "draft-not-found" | "invalid-selection" | "no-published-exercises";
      readonly message: string;
    };

export interface PersistentStudySessionDrafts extends StudySessionDraftPort {
  save(input: SaveTrustedGenerationDraftInput): Promise<{ readonly created: boolean }>;
  resolveReview(input: ResolveTrustedDraftInput): Promise<ResolveTrustedDraftResult>;
}

function normalized(value: string): string {
  return value.normalize("NFKC").trim();
}

function isTrustedDraft(value: unknown): value is TrustedGenerationDraft {
  if (value === null || typeof value !== "object") return false;
  const draft = value as Record<string, unknown>;

  return (
    draft.version === GENERATION_DRAFT_VERSION &&
    typeof draft.title === "string" &&
    typeof draft.level === "string" &&
    typeof draft.createdAt === "string" &&
    Array.isArray(draft.candidates)
  );
}

function invalidSelection(message: string) {
  return Object.freeze({
    ok: false as const,
    code: "invalid-selection" as const,
    message,
  });
}

export function createPersistentStudySessionDrafts(
  repository: GenerationDraftRepository,
  now: () => Date = () => new Date(),
): PersistentStudySessionDrafts {
  return {
    save(input) {
      const record: GenerationDraftRecord = {
        draftId: normalized(input.draftId),
        subjectId: normalized(input.subjectId),
        createdAt: input.draft.createdAt,
        expiresAt: input.expiresAt,
        payload: input.draft,
      };
      return repository.save(record);
    },

    async resolveReview(input) {
      const record = await repository.findActive(
        normalized(input.subjectId),
        normalized(input.sourceDraftId),
        now(),
      );

      if (record === undefined || !isTrustedDraft(record.payload)) {
        return Object.freeze({
          ok: false,
          code: "draft-not-found",
          message: "Generation draft was not found",
        });
      }

      const source = record.payload;
      const sourceCandidates = source.sourceCandidates;
      if (sourceCandidates === undefined) {
        return Object.freeze({
          ok: false,
          code: "draft-not-found",
          message: "Generation draft was not found",
        });
      }

      const byCandidateId = new Map(
        sourceCandidates.map((candidate) => [candidate.candidateId, candidate]),
      );
      const learningCandidates: LearningCandidate[] = [];

      for (const selection of input.selections) {
        const candidate = byCandidateId.get(normalized(selection.candidateId));
        if (candidate === undefined) {
          return invalidSelection("Selected candidate is not available in the trusted draft");
        }

        const sense = candidate.lexicalSenses?.find(
          (value) =>
            value.senseId === normalized(selection.senseId) &&
            value.partOfSpeech === candidate.type &&
            value.definition !== undefined,
        );
        if (sense?.definition === undefined) {
          return invalidSelection("Selected sense is not available in the trusted draft");
        }

        learningCandidates.push({
          candidateId: candidate.candidateId,
          displayForm: candidate.term,
          normalizedLemma: candidate.normalizedLemma,
          proposedPartOfSpeech: candidate.type,
          lexicalStatus: "verified",
          selectedSense: {
            senseId: sense.senseId,
            definition: sense.definition,
            partOfSpeech: sense.partOfSpeech,
            provenance: sense.provenance,
            confirmedBy: "learner-selection",
          },
          availableSenses: candidate.lexicalSenses ?? [],
          selectionReasons: candidate.selectionReasons,
        });
      }

      const outcomes = runCandidateExercisePipelines(
        learningCandidates.map((candidate) => {
          const sourceCandidate = byCandidateId.get(candidate.candidateId);
          return {
            candidate,
            examples:
              sourceCandidate?.verifiedExamplesBySenseId?.[
                candidate.selectedSense?.senseId ?? ""
              ] ??
              sourceCandidate?.verifiedExamples ??
              [],
          };
        }),
      );
      const outcomeByCandidateId = new Map(
        outcomes.map((value) => [value.candidateId, value.outcome]),
      );
      const definitionChoiceByCandidateId = new Map(
        publishReviewedDefinitionChoices({
          candidates: learningCandidates,
          sources: sourceCandidates,
          context: {
            topic: source.title,
            learnerLevel: source.level,
            locale: "en-US",
          },
        }).map((value) => [value.candidateId, value.outcome]),
      );
      const candidates = Object.freeze(
        learningCandidates.map((candidate) => {
          const legacyOutcome = outcomeByCandidateId.get(candidate.candidateId);
          const definitionChoiceOutcome = definitionChoiceByCandidateId.get(candidate.candidateId);

          return Object.freeze({
            candidateId: candidate.candidateId,
            outcome:
              legacyOutcome?.outcome === "publish"
                ? legacyOutcome
                : (definitionChoiceOutcome ?? legacyOutcome ?? ({ outcome: "reject" } as const)),
          });
        }),
      );
      const publishedCandidateIds = Object.freeze(
        candidates
          .filter((candidate) => candidate.outcome.outcome === "publish")
          .map((candidate) => candidate.candidateId),
      );
      const omittedCandidateIds = Object.freeze(
        candidates
          .filter((candidate) => candidate.outcome.outcome !== "publish")
          .map((candidate) => candidate.candidateId),
      );

      if (publishedCandidateIds.length === 0) {
        return Object.freeze({
          ok: false,
          code: "no-published-exercises",
          message: "No reviewed candidate produced a published exercise",
        });
      }

      const saved = await repository.save({
        draftId: normalized(input.resolvedDraftId),
        subjectId: normalized(input.subjectId),
        createdAt: source.createdAt,
        expiresAt: input.expiresAt,
        payload: Object.freeze({
          ...source,
          candidates,
        }),
      });

      if (!saved.created) {
        return invalidSelection("Resolved draft could not be created");
      }

      return Object.freeze({
        ok: true,
        expiresAt: input.expiresAt,
        publishedCandidateIds,
        omittedCandidateIds,
      });
    },

    async resolve(subjectId, request) {
      const record = await repository.findActive(
        normalized(subjectId),
        normalized(request.draftId),
        now(),
      );

      if (record === undefined || !isTrustedDraft(record.payload)) {
        return Object.freeze({
          ok: false,
          code: "draft-not-found",
          message: "Study session draft was not found",
        });
      }

      const draft = record.payload;
      if (
        normalized(request.title) !== normalized(draft.title) ||
        normalized(request.level) !== normalized(draft.level)
      ) {
        return invalidSelection("Study session metadata does not match the trusted draft");
      }

      const available = new Set(draft.candidates.map((candidate) => candidate.candidateId));
      const selectedCandidateIds = [
        ...new Set(request.selectedCandidateIds.map(normalized).filter(Boolean)),
      ];

      if (
        selectedCandidateIds.length === 0 ||
        selectedCandidateIds.some((candidateId) => !available.has(candidateId))
      ) {
        return invalidSelection("Selected candidates are not available in the trusted draft");
      }

      const input: BuildStudySessionSnapshotInput = Object.freeze({
        title: draft.title,
        level: draft.level,
        createdAt: draft.createdAt,
        selectedCandidateIds: Object.freeze(selectedCandidateIds),
        candidates: draft.candidates,
      });

      return Object.freeze({ ok: true, input });
    },
  };
}
