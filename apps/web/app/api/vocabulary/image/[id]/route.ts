import { NextResponse } from "next/server";

const workerUrl = "http://127.0.0.1:8765";
const validId = /^[a-f0-9]{24}$/u;

function normalizeWorkerJob(value: unknown): unknown {
  if (typeof value !== "object" || value === null) return value;
  const job = value as Record<string, unknown>;
  return job.status === "ready" ? { ...job, status: "approved" } : job;
}

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (!validId.test(id)) return NextResponse.json({ error: "Invalid image ID" }, { status: 400 });
  const wantsFile = new URL(request.url).searchParams.has("file");
  const path = wantsFile ? `/v1/images/files/${id}` : `/v1/images/jobs/${id}`;
  try {
    const response = await fetch(`${workerUrl}${path}`, {
      cache: wantsFile ? "force-cache" : "no-store",
      signal: AbortSignal.timeout(2_000),
    });
    if (!response.ok)
      return NextResponse.json({ error: "Image unavailable" }, { status: response.status });
    if (!wantsFile)
      return NextResponse.json(normalizeWorkerJob((await response.json()) as unknown));
    return new Response(await response.arrayBuffer(), {
      headers: {
        "content-type": "image/png",
        "cache-control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return NextResponse.json({ status: "unavailable" }, { status: 503 });
  }
}
