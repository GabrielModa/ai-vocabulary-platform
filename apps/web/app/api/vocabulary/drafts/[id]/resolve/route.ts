import { NextResponse } from "next/server";
import {
  getStudySessionRuntime,
  StudySessionRuntimeUnavailableError,
} from "../../../../../../src/study-session-runtime-registry";

interface RouteContext {
  readonly params: Promise<{ readonly id: string }>;
}

export async function POST(request: Request, context: RouteContext): Promise<Response> {
  try {
    const runtime = getStudySessionRuntime();
    return await runtime.resolveDraft(request, context);
  } catch (error) {
    if (error instanceof StudySessionRuntimeUnavailableError) {
      return NextResponse.json(
        {
          code: "STUDY_SESSION_RUNTIME_UNAVAILABLE",
          message: "Study sessions are temporarily unavailable",
        },
        { status: 503 },
      );
    }
    throw error;
  }
}
