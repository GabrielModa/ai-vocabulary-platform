import type {
  BuildStudySessionSnapshotInput,
  PublishedExerciseSelection,
} from "@vocabulary/domain-vocabulary";
import type {
  GenerationDraftRecord,
  GenerationDraftRepository,
} from "@vocabulary/database/runtime";
import type { StudySessionDraftPort } from "../app/api/study-sessions/http";

export const GENERATION_DRAFT_VERSION = "vocabulary-generation-draft-v1" as const;

export interface TrustedGenerationDraft {
  readonly version: typeof GENERATION_DRAFT_VERSION;
  readonly title: string;
  readonly level: string;
  readonly createdAt: string;
  readonly candidates: readonly PublishedExerciseSelection[];
}

export interface SaveTrustedGenerationDraftInput {
  readonly draftId: string;
  readonly subjectId: string;
  readonly expiresAt: string;
  readonly draft: TrustedGenerationDraft;
}

export interface PersistentStudySessionDrafts extends StudySessionDraftPort {
  save(input: SaveTrustedGenerationDraftInput): Promise<{ readonly created: boolean }>;
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
