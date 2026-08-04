import type { StudySessionRuntime, StudySessionRuntimeAdapters } from "./study-session-runtime";
import { createStudySessionRuntime } from "./study-session-runtime";

export class StudySessionRuntimeUnavailableError extends Error {
  constructor() {
    super("Study-session runtime is not configured");
    this.name = "StudySessionRuntimeUnavailableError";
  }
}

interface StudySessionRuntimeState {
  adapters?: StudySessionRuntimeAdapters;
  runtime?: StudySessionRuntime;
}

const globalState = globalThis as typeof globalThis & {
  __vocabularyStudySessionRuntime?: StudySessionRuntimeState;
};

function state(): StudySessionRuntimeState {
  globalState.__vocabularyStudySessionRuntime ??= {};
  return globalState.__vocabularyStudySessionRuntime;
}

export function configureStudySessionRuntime(adapters: StudySessionRuntimeAdapters): void {
  const current = state();
  current.adapters = adapters;
  delete current.runtime;
}

export function getStudySessionRuntime(): StudySessionRuntime {
  const current = state();
  if (current.runtime) return current.runtime;
  if (!current.adapters) {
    throw new StudySessionRuntimeUnavailableError();
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new StudySessionRuntimeUnavailableError();
  }

  current.runtime = createStudySessionRuntime({
    ...current.adapters,
    databaseUrl,
  });
  return current.runtime;
}

export async function resetStudySessionRuntimeForTests(): Promise<void> {
  const current = state();
  await current.runtime?.close();
  delete current.adapters;
  delete current.runtime;
}
