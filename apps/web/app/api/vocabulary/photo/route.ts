import { OllamaPhotoCandidateExtractor, OllamaPhotoError } from "@vocabulary/ai";

const MAX_BYTES = 10 * 1024 * 1024;
const levels = new Set(["A2", "B1", "B2", "C1", "C2"]);
const supportedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

interface PhotoExtractor {
  extract(request: {
    readonly bytes: Uint8Array;
    readonly mimeType: "image/jpeg" | "image/png" | "image/webp";
    readonly level: "A2" | "B1" | "B2" | "C1" | "C2";
  }): Promise<{ readonly terms: readonly string[] }>;
}

function matchesMagic(bytes: Uint8Array, type: string): boolean {
  if (type === "image/jpeg") return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (type === "image/png")
    return bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
  return (
    type === "image/webp" &&
    String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
    String.fromCharCode(...bytes.slice(8, 12)) === "WEBP"
  );
}

export function createPhotoCandidateHandler(extractor: PhotoExtractor) {
  return async (request: Request): Promise<Response> => {
    let form: FormData;
    try {
      form = await request.formData();
    } catch {
      return Response.json({ code: "INVALID_PHOTO" }, { status: 400 });
    }
    if (form.get("consent") !== "true")
      return Response.json({ code: "CONSENT_REQUIRED" }, { status: 400 });
    const photo = form.get("photo");
    const level = form.get("level");
    if (
      !(photo instanceof File) ||
      typeof level !== "string" ||
      !levels.has(level) ||
      !supportedTypes.has(photo.type) ||
      photo.size <= 0 ||
      photo.size > MAX_BYTES
    )
      return Response.json({ code: "INVALID_PHOTO" }, { status: 400 });
    const bytes = new Uint8Array(await photo.arrayBuffer());
    if (!matchesMagic(bytes, photo.type))
      return Response.json({ code: "INVALID_PHOTO" }, { status: 400 });
    try {
      return Response.json(
        await extractor.extract({
          bytes,
          mimeType: photo.type as "image/jpeg" | "image/png" | "image/webp",
          level: level as "A2" | "B1" | "B2" | "C1" | "C2",
        }),
      );
    } catch (error) {
      if (error instanceof OllamaPhotoError && error.code === "UNAVAILABLE")
        return Response.json({ code: "VISION_UNAVAILABLE" }, { status: 503 });
      return Response.json({ code: "INVALID_EXTRACTION" }, { status: 422 });
    }
  };
}

export const POST = createPhotoCandidateHandler(
  new OllamaPhotoCandidateExtractor({
    ...(process.env.OLLAMA_BASE_URL ? { baseUrl: process.env.OLLAMA_BASE_URL } : {}),
    ...(process.env.OLLAMA_VISION_MODEL ? { model: process.env.OLLAMA_VISION_MODEL } : {}),
  }),
);
