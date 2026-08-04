import {
  buildStudySessionSnapshot,
  type BuildStudySessionSnapshotInput,
  type StudySessionSnapshot,
  type StudySessionSnapshotFailureCode,
} from "./study-session-snapshot.js";

export interface StudySessionSnapshotPort {
  save(snapshot: StudySessionSnapshot): Promise<
    | {
        readonly ok: true;
        readonly created: boolean;
        readonly snapshot: StudySessionSnapshot;
      }
    | {
        readonly ok: false;
        readonly code: "session-id-conflict";
        readonly message: string;
      }
  >;
  findById(sessionId: string): Promise<StudySessionSnapshot | undefined>;
}

export type CreateStudySessionResult =
  | {
      readonly ok: true;
      readonly status: "created" | "existing";
      readonly snapshot: StudySessionSnapshot;
      readonly omittedCandidateIds: readonly string[];
    }
  | {
      readonly ok: false;
      readonly status: "invalid";
      readonly code: StudySessionSnapshotFailureCode;
      readonly message: string;
    }
  | {
      readonly ok: false;
      readonly status: "conflict";
      readonly code: "session-id-conflict";
      readonly message: string;
    };

export type GetStudySessionResult =
  | {
      readonly ok: true;
      readonly status: "found";
      readonly snapshot: StudySessionSnapshot;
    }
  | {
      readonly ok: false;
      readonly status: "not-found";
      readonly code: "study-session-not-found";
      readonly message: string;
    };

export interface StudySessionApplication {
  create(input: BuildStudySessionSnapshotInput): Promise<CreateStudySessionResult>;
  get(sessionId: string): Promise<GetStudySessionResult>;
}

function normalizedSessionId(sessionId: string): string {
  return sessionId.normalize("NFKC").trim();
}

export function createStudySessionApplication(
  repository: StudySessionSnapshotPort,
): StudySessionApplication {
  return {
    async create(input) {
      const built = buildStudySessionSnapshot(input);
      if (!built.ok) {
        return Object.freeze({
          ok: false,
          status: "invalid",
          code: built.code,
          message: built.message,
        });
      }

      const saved = await repository.save(built.snapshot);
      if (!saved.ok) {
        return Object.freeze({
          ok: false,
          status: "conflict",
          code: saved.code,
          message: saved.message,
        });
      }

      return Object.freeze({
        ok: true,
        status: saved.created ? "created" : "existing",
        snapshot: saved.snapshot,
        omittedCandidateIds: built.omittedCandidateIds,
      });
    },

    async get(sessionId) {
      const normalized = normalizedSessionId(sessionId);
      if (!normalized) {
        return Object.freeze({
          ok: false,
          status: "not-found",
          code: "study-session-not-found",
          message: "Study session was not found",
        });
      }

      const snapshot = await repository.findById(normalized);
      return snapshot === undefined
        ? Object.freeze({
            ok: false,
            status: "not-found",
            code: "study-session-not-found",
            message: "Study session was not found",
          })
        : Object.freeze({
            ok: true,
            status: "found",
            snapshot,
          });
    },
  };
}
