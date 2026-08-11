import { describe, expect, it } from "vitest";
import {
  readVisualCluesEnabled,
  writeVisualCluesEnabled,
  type PreferenceStorage,
} from "./visual-clue-preferences";

function storage(initial?: string): PreferenceStorage & { value: string | undefined } {
  return {
    value: initial,
    getItem() {
      return this.value ?? null;
    },
    setItem(_key, value) {
      this.value = value;
    },
  };
}

describe("visual clue preferences", () => {
  it("enables visual clues by default and for invalid stored values", () => {
    expect(readVisualCluesEnabled(storage())).toBe(true);
    expect(readVisualCluesEnabled(storage("invalid"))).toBe(true);
  });

  it("persists an explicit disabled preference", () => {
    const target = storage();
    writeVisualCluesEnabled(target, false);
    expect(readVisualCluesEnabled(target)).toBe(false);
  });
});
