import { OllamaVocabularyError, OllamaVocabularyGenerator } from "@vocabulary/ai";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ code: "INVALID_REQUEST" }, { status: 400 });
  }
  try {
    const generator = new OllamaVocabularyGenerator({
      ...(process.env.OLLAMA_BASE_URL ? { baseUrl: process.env.OLLAMA_BASE_URL } : {}),
      ...(process.env.OLLAMA_MODEL ? { model: process.env.OLLAMA_MODEL } : {}),
    });
    return NextResponse.json(await generator.generate(body));
  } catch (error) {
    if (error instanceof OllamaVocabularyError && error.code === "UNAVAILABLE") {
      return NextResponse.json({ code: "OLLAMA_UNAVAILABLE" }, { status: 503 });
    }
    return NextResponse.json({ code: "GENERATION_FAILED" }, { status: 422 });
  }
}
