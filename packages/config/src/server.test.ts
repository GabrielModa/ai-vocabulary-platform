import { describe, expect, it } from "vitest";
import { ConfigurationError } from "./errors.js";
import { parseServerConfig } from "./server.js";

const validEnvironment = {
  NODE_ENV: "test",
  PORT: "3100",
  DATABASE_URL: "postgresql://user:password@localhost:5432/vocabulary",
  REDIS_URL: "redis://localhost:6379",
  BETTER_AUTH_SECRET: "a-secure-test-value-with-32-characters",
  BETTER_AUTH_URL: "http://localhost:3000",
};

describe("parseServerConfig", () => {
  it("returns typed, coerced, immutable configuration", () => {
    const config = parseServerConfig(validEnvironment);
    expect(config.PORT).toBe(3100);
    expect(config.NODE_ENV).toBe("test");
    expect(Object.isFrozen(config)).toBe(true);
  });

  it("rejects a missing required secret without exposing other values", () => {
    const unsafeDatabaseValue = "postgresql://private-user:private-password@secret-host/database";
    expect(() =>
      parseServerConfig({
        ...validEnvironment,
        DATABASE_URL: unsafeDatabaseValue,
        BETTER_AUTH_SECRET: undefined,
      }),
    ).toThrow(ConfigurationError);
    try {
      parseServerConfig({
        ...validEnvironment,
        DATABASE_URL: unsafeDatabaseValue,
        BETTER_AUTH_SECRET: undefined,
      });
    } catch (error) {
      expect(String(error)).toContain("BETTER_AUTH_SECRET");
      expect(String(error)).not.toContain(unsafeDatabaseValue);
      expect(String(error)).not.toContain("private-password");
    }
  });

  it("rejects invalid protocols and ports", () => {
    expect(() =>
      parseServerConfig({
        ...validEnvironment,
        DATABASE_URL: "https://database.example",
        PORT: "70000",
      }),
    ).toThrow(ConfigurationError);
  });

  it("converts empty optional provider values to undefined", () => {
    expect(
      parseServerConfig({ ...validEnvironment, OPENAI_API_KEY: "" }).OPENAI_API_KEY,
    ).toBeUndefined();
  });
});
