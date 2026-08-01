import { describe, expect, it } from "vitest";
import { loadMobileConfig } from "./config";

describe("loadMobileConfig", () => {
  it("exposes only public Expo configuration", () => {
    process.env.EXPO_PUBLIC_APP_ENV = "test";
    process.env.EXPO_PUBLIC_API_URL = "https://api.example.com";
    process.env.OPENAI_API_KEY = "server-only";
    expect(loadMobileConfig()).toEqual({
      EXPO_PUBLIC_API_URL: "https://api.example.com",
      EXPO_PUBLIC_APP_ENV: "test",
    });
    expect("OPENAI_API_KEY" in loadMobileConfig()).toBe(false);
  });
});
