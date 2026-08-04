import { NextResponse } from "next/server";
import {
  getStudySessionRuntime,
  StudySessionRuntimeUnavailableError,
} from "../../../src/study-session-runtime-registry";

export async function POST(request: Request): Promise<NextResponse> {
  try {
    return await getStudySessionRuntime().handlers.POST(request);
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
