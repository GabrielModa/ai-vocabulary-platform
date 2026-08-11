import { describe, expect, it, vi } from "vitest";
import { createPhotoCandidateHandler } from "./route";

function request(options: { consent?: string; type?: string; bytes?: number } = {}): Request {
  const form = new FormData();
  form.set("consent", options.consent ?? "true");
  form.set("level", "A2");
  const type = options.type ?? "image/jpeg";
  const bytes = new Uint8Array(options.bytes ?? 3);
  if (type === "image/jpeg") bytes.set([0xff, 0xd8, 0xff]);
  if (type === "image/png") bytes.set([0x89, 0x50, 0x4e, 0x47]);
  form.set("photo", new File([bytes], "scene.jpg", { type }));
  return new Request("http://local/api/vocabulary/photo", { method: "POST", body: form });
}

describe("photo candidate HTTP boundary", () => {
  it("returns bounded candidates from an in-memory photo", async () => {
    const extract = vi.fn().mockResolvedValue({ terms: ["book", "lamp"] });
    const response = await createPhotoCandidateHandler({ extract })(request());
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ terms: ["book", "lamp"] });
    expect(extract).toHaveBeenCalledWith(
      expect.objectContaining({ mimeType: "image/jpeg", level: "A2" }),
    );
  });

  it.each([
    [{ consent: "false" }, "CONSENT_REQUIRED"],
    [{ type: "image/gif" }, "INVALID_PHOTO"],
    [{ bytes: 10 * 1024 * 1024 + 1 }, "INVALID_PHOTO"],
  ])("rejects invalid input without invoking vision", async (options, code) => {
    const extract = vi.fn();
    const response = await createPhotoCandidateHandler({ extract })(request(options));
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ code });
    expect(extract).not.toHaveBeenCalled();
  });
});
