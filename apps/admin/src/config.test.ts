import { describe, expect, it } from "vitest";
import { parseAdminConfig } from "./config";

describe("admin configuration", () => {
  it("loads only the dedicated operator environment", () => {
    const config = parseAdminConfig({
      ADMIN_APP_ENV: "test",
      ADMIN_API_URL: "https://admin-api.example.com",
      NEXT_PUBLIC_API_URL: "https://learner-api.example.com",
      EXPO_PUBLIC_API_URL: "https://mobile-api.example.com",
    });

    expect(config).toEqual({
      ADMIN_APP_ENV: "test",
      ADMIN_API_URL: "https://admin-api.example.com",
    });
    expect("NEXT_PUBLIC_API_URL" in config).toBe(false);
    expect("EXPO_PUBLIC_API_URL" in config).toBe(false);
  });

  it("rejects invalid operator endpoints", () => {
    expect(() => parseAdminConfig({ ADMIN_API_URL: "file:///operator-data" })).toThrow();
  });
});
