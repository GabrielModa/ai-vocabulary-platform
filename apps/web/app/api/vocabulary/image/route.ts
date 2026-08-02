import { NextResponse } from "next/server";

const workerUrl = "http://127.0.0.1:8765";

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    const response = await fetch(`${workerUrl}/v1/images/jobs`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
      signal: AbortSignal.timeout(2_000),
    });
    const result: unknown = await response.json();
    return NextResponse.json(result, { status: response.status });
  } catch {
    return NextResponse.json({ status: "unavailable" }, { status: 503 });
  }
}
