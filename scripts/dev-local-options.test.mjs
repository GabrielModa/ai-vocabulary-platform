import { describe, expect, it } from "vitest";

import { parseDevLocalOptions } from "./dev-local-options.mjs";

describe("dev local options", () => {
  it("keeps images enabled by default", () => {
    expect(parseDevLocalOptions([])).toEqual({ imagesEnabled: true });
  });

  it("disables only image-worker startup with the explicit flag", () => {
    expect(parseDevLocalOptions(["--no-images"])).toEqual({ imagesEnabled: false });
  });

  it("rejects unknown startup flags", () => {
    expect(() => parseDevLocalOptions(["--fast-ish"])).toThrow(/Unknown dev:local option/u);
  });
});
