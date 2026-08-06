import { describe, expect, it } from "vitest";
import { imageWorkerEndpoint, imageWorkerUrl } from "./image-worker-client";

describe("image worker client", () => {
  it("uses the local worker by default", () => {
    expect(imageWorkerUrl(undefined)).toBe("http://127.0.0.1:8765");
  });

  it("normalizes configured worker URLs", () => {
    expect(imageWorkerUrl("http://localhost:9000///")).toBe("http://localhost:9000");
    expect(imageWorkerEndpoint("v1/images/jobs", "http://localhost:9000/")).toBe(
      "http://localhost:9000/v1/images/jobs",
    );
  });
});
