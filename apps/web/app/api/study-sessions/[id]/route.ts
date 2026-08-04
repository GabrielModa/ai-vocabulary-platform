import { NextResponse } from "next/server";
import {
  getStudySessionRuntime,
  StudySessionRuntimeUnavailableError,
} from "../../../../src/study-session-runtime-registry";

interface RouteContext {
  readonly params: Promise<{ readonly id: string }>;
}

export async function GET(request: Request, context: RouteContext): Promise<NextResponse> {
  try {
    return await getStudySessionRuntime().handlers.GET(request, context);
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
