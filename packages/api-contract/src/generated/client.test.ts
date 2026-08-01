import { describe, expect, it, vi } from "vitest";
import { createApiClient, type HealthResponse } from "./client.js";

describe("generated API client", () => {
  it("calls the versioned liveness endpoint", async () => {
    const fetchImplementation = vi.fn(() =>
      Promise.resolve(new Response(JSON.stringify({ status: "ok" }), { status: 200 })),
    );
    const client = createApiClient({
      baseUrl: "https://api.example.test",
      fetch: fetchImplementation,
    });
    const response: HealthResponse = await client.getLiveness();
    expect(response).toEqual({ status: "ok" });
    expect(fetchImplementation).toHaveBeenCalledWith("https://api.example.test/v1/health/live");
  });
});
