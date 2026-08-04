import type {
  CreateStudySessionResult,
  GetStudySessionResult,
  StudySessionApplication,
} from "./study-session-application.js";
import type { BuildStudySessionSnapshotInput } from "./study-session-snapshot.js";

export interface StudySessionOwnershipPort {
  bind(subjectId: string, sessionId: string): Promise<{ readonly created: boolean }>;
  owns(subjectId: string, sessionId: string): Promise<boolean>;
}

export type CreateOwnedStudySessionResult =
  | CreateStudySessionResult
  | {
      readonly ok: false;
      readonly status: "ownership-failed";
      readonly code: "study-session-ownership-failed";
      readonly message: string;
    };

export type GetOwnedStudySessionResult = GetStudySessionResult;

export interface OwnedStudySessionApplication {
  create(
    subjectId: string,
    input: BuildStudySessionSnapshotInput,
  ): Promise<CreateOwnedStudySessionResult>;
  get(subjectId: string, sessionId: string): Promise<GetOwnedStudySessionResult>;
}

function normalizedIdentity(value: string): string {
  return value.normalize("NFKC").trim();
}

const notFound = Object.freeze({
  ok: false as const,
  status: "not-found" as const,
  code: "study-session-not-found" as const,
  message: "Study session was not found",
});

export function createOwnedStudySessionApplication(
  sessions: StudySessionApplication,
  ownership: StudySessionOwnershipPort,
): OwnedStudySessionApplication {
  return {
    async create(subjectId, input) {
      const normalizedSubjectId = normalizedIdentity(subjectId);
      if (!normalizedSubjectId) {
        return Object.freeze({
          ok: false,
          status: "ownership-failed",
          code: "study-session-ownership-failed",
          message: "Authenticated learner identity is required",
        });
      }

      const result = await sessions.create(input);
      if (!result.ok) return result;

      try {
        await ownership.bind(normalizedSubjectId, result.snapshot.sessionId);
      } catch {
        return Object.freeze({
          ok: false,
          status: "ownership-failed",
          code: "study-session-ownership-failed",
          message: "Study session ownership could not be recorded",
        });
      }

      return result;
    },

    async get(subjectId, sessionId) {
      const normalizedSubjectId = normalizedIdentity(subjectId);
      const normalizedSessionId = normalizedIdentity(sessionId);
      if (!normalizedSubjectId || !normalizedSessionId) return notFound;

      if (!(await ownership.owns(normalizedSubjectId, normalizedSessionId))) {
        return notFound;
      }

      return sessions.get(normalizedSessionId);
    },
  };
}
