import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import { parseMobileConfig, parseWebConfig } from "./client.js";

describe("client configuration", () => {
  it("parses only explicitly public web values", () => {
    const config = parseWebConfig({
      NEXT_PUBLIC_API_URL: "https://api.example.com",
      BETTER_AUTH_SECRET: "must-not-cross-the-client-boundary",
    });
    expect(config).toEqual({
      NEXT_PUBLIC_APP_ENV: "development",
      NEXT_PUBLIC_API_URL: "https://api.example.com",
    });
    expect("BETTER_AUTH_SECRET" in config).toBe(false);
  });

  it("parses public Expo values separately", () => {
    expect(
      parseMobileConfig({
        EXPO_PUBLIC_APP_ENV: "production",
        EXPO_PUBLIC_API_URL: "https://api.example.com",
      }),
    ).toEqual({
      EXPO_PUBLIC_APP_ENV: "production",
      EXPO_PUBLIC_API_URL: "https://api.example.com",
    });
  });

  it("rejects non-HTTP API URLs", () => {
    expect(() => parseWebConfig({ NEXT_PUBLIC_API_URL: "file:///private/config" })).toThrow(
      "NEXT_PUBLIC_API_URL",
    );
  });

  it("keeps server variable names out of the client module", async () => {
    const source = await readFile(new URL("./client.ts", import.meta.url), "utf8");
    expect(source).not.toMatch(/BETTER_AUTH_SECRET|DATABASE_URL|OPENAI_API_KEY/u);
  });
});
