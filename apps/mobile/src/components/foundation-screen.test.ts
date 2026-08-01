import { describe, expect, it } from "vitest";
import { getFoundationAccessibility, statusCopy } from "./foundation-state";

describe("mobile foundation state", () => {
  it("exposes a clear offline status to assistive technology", () => {
    expect(statusCopy.offline).toContain("Offline");
    expect(getFoundationAccessibility("offline", false).statusLabel).toBe(
      "Application status: Offline — saved learning will remain available",
    );
  });

  it("describes the active reduced-motion preference", () => {
    expect(getFoundationAccessibility("online", true).motionHint).toBe("Animations are reduced");
  });

  it("describes the default system motion behavior", () => {
    expect(getFoundationAccessibility("unknown", false).motionHint).toBe(
      "Animations follow system settings",
    );
  });
});
