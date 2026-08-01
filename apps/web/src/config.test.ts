import { describe, expect, it } from "vitest";
import { loadWebConfig } from "./config.js";

describe("loadWebConfig", () => {
  it("loads explicitly public values", () => {
    process.env.NEXT_PUBLIC_APP_ENV = "test";
    process.env.NEXT_PUBLIC_API_URL = "https://api.example.com";
    process.env.BETTER_AUTH_SECRET = "server-only";
    expect(loadWebConfig()).toEqual({
      NEXT_PUBLIC_API_URL: "https://api.example.com",
      NEXT_PUBLIC_APP_ENV: "test",
    });
    expect("BETTER_AUTH_SECRET" in loadWebConfig()).toBe(false);
  });
});
