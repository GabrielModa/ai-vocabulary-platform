import { describe, expect, it } from "vitest";
import { mapConnectivity } from "./network-status";

describe("mapConnectivity", () => {
  it.each([
    [false, null, "offline"],
    [true, false, "offline"],
    [true, true, "online"],
    [true, null, "online"],
    [null, null, "unknown"],
  ] as const)("maps connection=%s reachability=%s to %s", (connection, reachability, expected) => {
    expect(mapConnectivity(connection, reachability)).toBe(expected);
  });
});
